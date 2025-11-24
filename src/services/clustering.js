/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vecA - First vector
 * @param {Array<number>} vecB - Second vector
 * @returns {number} Similarity score between 0 and 1
 */
export function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magA += vecA[i] * vecA[i];
        magB += vecB[i] * vecB[i];
    }

    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);

    if (magA === 0 || magB === 0) {
        return 0;
    }

    return dotProduct / (magA * magB);
}

/**
 * Group items by similarity using hierarchical clustering
 * @param {Array} items - Items with embeddings
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {Promise<Array>} Array of groups
 */
// export async function groupBySimilarity(items, threshold = 0.75) {
//     if (!items || items.length === 0) {
//         return [];
//     }

//     const groups = [];
//     const grouped = new Set();

//     // Sort items by name for consistent grouping
//     const sortedItems = [...items].sort((a, b) =>
//         a.name.localeCompare(b.name)
//     );

//     for (let i = 0; i < sortedItems.length; i++) {
//         if (grouped.has(i)) continue;

//         const currentItem = sortedItems[i];
//         const currentGroup = {
//             centroid: [...currentItem.embedding],
//             members: [currentItem]
//         };
//         grouped.add(i);

//         // Find similar items
//         for (let j = i + 1; j < sortedItems.length; j++) {
//             if (grouped.has(j)) continue;

//             const similarity = cosineSimilarity(
//                 currentGroup.centroid,
//                 sortedItems[j].embedding
//             );

//             if (similarity >= threshold) {
//                 currentGroup.members.push(sortedItems[j]);
//                 grouped.add(j);

//                 // Update centroid (moving average)
//                 updateCentroid(currentGroup.centroid, sortedItems[j].embedding);
//             }
//         }

//         groups.push(currentGroup);
//     }

//     return groups;
// }
export function groupBySimilarity(items, threshold = 0.75) {
    const groups = [];

    for (const item of items) {
        let placed = false;

        for (const group of groups) {
            const similarity = cosineSimilarity(
                item.embedding,
                group.centroid
            );

            if (similarity >= threshold) {
                group.members.push(item);

                // update centroid
                group.centroid = averageEmbedding([
                    ...group.members.map(m => m.embedding)
                ]);

                placed = true;
                break;
            }
        }

        if (!placed) {
            groups.push({
                centroid: item.embedding,
                members: [item]
            });
        }
    }

    return groups;
}

/**
 * Update centroid with new vector (incremental average)
 * @param {Array<number>} centroid - Current centroid
 * @param {Array<number>} newVector - New vector to add
 */
function updateCentroid(centroid, newVector) {
    for (let i = 0; i < centroid.length; i++) {
        centroid[i] = (centroid[i] + newVector[i]) / 2;
    }
}

/**
 * Find optimal threshold using silhouette score
 * @param {Array} items - Items with embeddings
 * @param {Array<number>} thresholds - Thresholds to test
 * @returns {number} Optimal threshold
 */
export function findOptimalThreshold(items, thresholds = [0.6, 0.7, 0.75, 0.8, 0.85]) {
    let bestThreshold = 0.75;
    let bestScore = -1;

    for (const threshold of thresholds) {
        const groups = groupBySimilarity(items, threshold);
        const score = calculateSilhouetteScore(groups);

        if (score > bestScore) {
            bestScore = score;
            bestThreshold = threshold;
        }
    }

    return bestThreshold;
}

/**
 * Calculate silhouette score for clustering quality
 * @param {Array} groups - Array of groups
 * @returns {number} Silhouette score
 */
function calculateSilhouetteScore(groups) {
    if (groups.length <= 1) return 0;

    let totalScore = 0;
    let totalItems = 0;

    for (const group of groups) {
        for (const item of group.members) {
            // Calculate average distance within cluster
            const a = averageIntraClusterDistance(item, group.members);

            // Calculate average distance to nearest cluster
            const b = minInterClusterDistance(item, groups, group);

            // Silhouette coefficient for this item
            const s = (b - a) / Math.max(a, b);
            totalScore += s;
            totalItems++;
        }
    }

    return totalItems > 0 ? totalScore / totalItems : 0;
}

/**
 * Calculate average distance within cluster
 * @param {Object} item - Current item
 * @param {Array} members - Cluster members
 * @returns {number} Average distance
 */
function averageIntraClusterDistance(item, members) {
    if (members.length <= 1) return 0;

    let sum = 0;
    let count = 0;

    for (const member of members) {
        if (member !== item) {
            sum += 1 - cosineSimilarity(item.embedding, member.embedding);
            count++;
        }
    }

    return count > 0 ? sum / count : 0;
}

/**
 * Calculate minimum distance to nearest cluster
 * @param {Object} item - Current item
 * @param {Array} groups - All groups
 * @param {Object} currentGroup - Current group
 * @returns {number} Minimum distance
 */
function minInterClusterDistance(item, groups, currentGroup) {
    let minDistance = Infinity;

    for (const group of groups) {
        if (group === currentGroup) continue;

        let sum = 0;
        for (const member of group.members) {
            sum += 1 - cosineSimilarity(item.embedding, member.embedding);
        }

        const avgDistance = sum / group.members.length;
        minDistance = Math.min(minDistance, avgDistance);
    }

    return minDistance === Infinity ? 0 : minDistance;
}

function averageEmbedding(vectors) {
    const length = vectors[0].length;
    const sum = new Array(length).fill(0);

    // sum all vectors
    for (const vec of vectors) {
        for (let i = 0; i < length; i++) {
            sum[i] += vec[i];
        }
    }

    // divide by number of vectors
    return sum.map(v => v / vectors.length);
}
