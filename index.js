// import { processDataFile } from "./src/processor.js";

// async function run() {
//     const input = './input.csv';  // your uploaded CSV
//     const output = './output.csv';

//     try {
//         const result = await processDataFile(input, {
//             outputPath: output,
//             format: 'condensed',   // 🔥 <-- use condensed to get 1 row per group
//             threshold: 0.75
//         });

//         console.log("Processing completed!");
//         console.log("Grouped output written to:", result.outputPath);

//     } catch (err) {
//         console.error("Error:", err.message);
//     }
// }

// run();
import { processDataFile } from "./src/processor.js";

async function run() {
    await processDataFile("./input.csv", {
        outputPath: "./condensed.csv",
        format: "condensed" // 1 row per group, but still duplicates possible
    });
}

run();
