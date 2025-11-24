import fs from "fs";
import csv from "csv-parser";
import { mergeGroups } from "./src/merge.js";

const inputFile = "condensed.csv";
const outputFile = "final_output.csv";

function readCSV() {
    return new Promise((resolve) => {
        const rows = [];
        fs.createReadStream(inputFile)
            .pipe(csv())
            .on("data", row => rows.push(row))
            .on("end", () => resolve(rows));
    });
}

function writeCSV(data) {
    const header = "group_id,group_name,members_id,members_name\n";
    const rows = data
        .map(g => `${g.group_id},${g.group_name},"${g.members_id.join(",")}","${g.members_name.join(",")}"`)
        .join("\n");

    fs.writeFileSync(outputFile, header + rows);
}

(async () => {
    const rows = await readCSV();
    const merged = mergeGroups(rows);
    writeCSV(merged);
    console.log("✅ final_output.csv created");
})();
