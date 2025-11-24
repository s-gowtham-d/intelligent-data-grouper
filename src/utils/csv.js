import fs from 'fs';
import { createReadStream, createWriteStream } from 'fs';
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

/**
 * Read CSV file and parse it
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array>} Parsed data
 */
export function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];

        createReadStream(filePath)
            .pipe(csvParser({
                mapHeaders: ({ header }) => header.toLowerCase().trim(),
                skipEmptyLines: true,
                trim: true
            }))
            .on('data', (data) => {
                // Clean and validate data
                const cleanedData = {};
                for (const [key, value] of Object.entries(data)) {
                    cleanedData[key] = value ? value.trim() : '';
                }

                if (cleanedData.id && cleanedData.name) {
                    results.push(cleanedData);
                }
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(new Error(`Failed to read CSV: ${error.message}`));
            });
    });
}

/**
 * Write grouped data to CSV file in detailed format (one row per item)
 * @param {string} outputPath - Output file path
 * @param {Array} groups - Grouped data
 * @returns {Promise<void>}
 */
export async function writeCSV(outputPath, groups) {
    try {
        const csvWriter = createObjectCsvWriter({
            path: outputPath,
            header: [
                { id: 'group_id', title: 'group_id' },
                { id: 'group_name', title: 'group_name' },
                { id: 'member_id', title: 'member_id' },
                { id: 'member_name', title: 'member_name' }
            ]
        });

        // Flatten groups into rows
        const records = [];
        for (const group of groups) {
            for (const member of group.members) {
                records.push({
                    group_id: group.groupId,
                    group_name: group.groupName,
                    member_id: member.id,
                    member_name: member.name
                });
            }
        }

        await csvWriter.writeRecords(records);
    } catch (error) {
        throw new Error(`Failed to write CSV: ${error.message}`);
    }
}

/**
 * Write grouped data to CSV file in condensed format (one row per group with comma-separated members)
 * @param {string} outputPath - Output file path
 * @param {Array} groups - Grouped data
 * @returns {Promise<void>}
 */
// export async function writeCondensedCSV(outputPath, groups) {
//     try {
//         const csvWriter = createObjectCsvWriter({
//             path: outputPath,
//             header: [
//                 { id: 'group_id', title: 'group_id' },
//                 { id: 'group_name', title: 'group_name' },
//                 { id: 'members_id', title: 'members_id' },
//                 { id: 'members_name', title: 'members_name' }
//             ]
//         });

//         const records = groups.map(group => ({
//             group_id: group.groupId,
//             group_name: group.groupName,
//             members_id: group.members.map(m => m.id).join(','),
//             members_name: group.members.map(m => m.name).join(', ')
//         }));

//         await csvWriter.writeRecords(records);
//     } catch (error) {
//         throw new Error(`Failed to write condensed CSV: ${error.message}`);
//     }
// }
/**
 * Write condensed CSV: one row per group
 * @param {string} outputPath
 * @param {Array} groups
 */
export async function writeCondensedCSV(outputPath, groups) {
    try {
        const csvWriter = createObjectCsvWriter({
            path: outputPath,
            header: [
                { id: 'group_id', title: 'group_id' },
                { id: 'group_name', title: 'group_name' },
                { id: 'members_id', title: 'members_id' },
                { id: 'members_name', title: 'members_name' }
            ]
        });

        const records = groups.map(group => {
            const memberIds = group.members.map(m => m.id).join(',');
            const memberNames = group.members.map(m => m.name).join(', ');

            return {
                group_id: group.groupId,
                group_name: group.groupName,
                members_id: memberIds,
                members_name: memberNames
            };
        });

        await csvWriter.writeRecords(records);

    } catch (error) {
        throw new Error(`Failed to write condensed CSV: ${error.message}`);
    }
}

/**
 * Write summary CSV with aggregated group information
 * @param {string} outputPath - Output file path
 * @param {Array} groups - Grouped data
 * @returns {Promise<void>}
 */
export async function writeSummaryCSV(outputPath, groups) {
    try {
        const csvWriter = createObjectCsvWriter({
            path: outputPath,
            header: [
                { id: 'group_id', title: 'group_id' },
                { id: 'group_name', title: 'group_name' },
                { id: 'member_count', title: 'member_count' },
                { id: 'group_members', title: 'group_members' }
            ]
        });

        const records = groups.map(group => ({
            group_id: group.groupId,
            group_name: group.groupName,
            member_count: group.members.length,
            group_members: group.members.map(m => `${m.id}:${m.name}`).join('; ')
        }));

        await csvWriter.writeRecords(records);
    } catch (error) {
        throw new Error(`Failed to write summary CSV: ${error.message}`);
    }
}

/**
 * Validate CSV file structure
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Object>} Validation result
 */
export async function validateCSVStructure(filePath) {
    return new Promise((resolve, reject) => {
        const headers = [];
        let lineCount = 0;

        createReadStream(filePath)
            .pipe(csvParser())
            .on('headers', (headerList) => {
                headers.push(...headerList.map(h => h.toLowerCase().trim()));
            })
            .on('data', () => {
                lineCount++;
            })
            .on('end', () => {
                const hasId = headers.includes('id');
                const hasName = headers.includes('name');

                resolve({
                    valid: hasId && hasName,
                    headers,
                    lineCount,
                    errors: [
                        ...(!hasId ? ['Missing "id" column'] : []),
                        ...(!hasName ? ['Missing "name" column'] : [])
                    ]
                });
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}