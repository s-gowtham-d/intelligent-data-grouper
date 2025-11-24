#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { processDataFile } from './processor.js';
import { config } from './config.js';
import path from 'path';
import fs from 'fs/promises';

const program = new Command();

program
    .name('group-data')
    .description('Intelligent data grouping using AI and vector embeddings')
    .version('1.0.0');

program
    .command('process')
    .description('Process a CSV file and group similar items')
    .argument('<input-file>', 'Path to the input CSV file')
    .option('-o, --output <file>', 'Output file path', 'grouped_output.csv')
    .option('-t, --threshold <number>', 'Similarity threshold (0-1)', '0.75')
    .option('--api-key <key>', 'Google Gemini API key (or use GEMINI_API_KEY env var)')
    .option('--no-cache', 'Disable caching (slower but uses less disk space)')
    .option('--clear-cache', 'Clear cache before processing')
    .option('--parallel <number>', 'Number of parallel batches (1-5)', '3')
    .option('--format <type>', 'Output format: detailed (default), condensed, summary, all', 'detailed')
    .action(async (inputFile, options) => {
        const spinner = ora('Initializing...').start();

        try {
            // Validate input file
            const inputPath = path.resolve(inputFile);
            await fs.access(inputPath);

            // Set API key
            if (options.apiKey) {
                process.env.GEMINI_API_KEY = options.apiKey;
            }

            if (!process.env.GEMINI_API_KEY) {
                spinner.fail(chalk.red('Error: GEMINI_API_KEY not found'));
                console.log(chalk.yellow('\nPlease provide API key via:'));
                console.log(chalk.cyan('  1. --api-key flag'));
                console.log(chalk.cyan('  2. GEMINI_API_KEY environment variable'));
                console.log(chalk.cyan('  3. .env file\n'));
                process.exit(1);
            }

            // Handle cache options
            if (options.cache === false) {
                process.env.ENABLE_CACHING = 'false';
            }

            if (options.clearCache) {
                const { EmbeddingCache } = await import('./services/cache.js');
                const cache = new EmbeddingCache();
                spinner.text = 'Clearing cache...';
                await cache.clear();
                spinner.succeed(chalk.green('Cache cleared'));
            }

            // Set parallel batches
            const parallel = parseInt(options.parallel);
            if (!isNaN(parallel) && parallel >= 1 && parallel <= 5) {
                process.env.PARALLEL_BATCHES = parallel.toString();
            }

            const threshold = parseFloat(options.threshold);
            if (isNaN(threshold) || threshold < 0 || threshold > 1) {
                spinner.fail(chalk.red('Error: Threshold must be between 0 and 1'));
                process.exit(1);
            }

            // Validate format option
            const validFormats = ['detailed', 'condensed', 'summary', 'all'];
            if (!validFormats.includes(options.format)) {
                spinner.fail(chalk.red(`Error: Format must be one of: ${validFormats.join(', ')}`));
                process.exit(1);
            }

            spinner.text = 'Reading input file...';

            // Process the file
            const result = await processDataFile(inputPath, {
                outputPath: path.resolve(options.output),
                threshold,
                spinner,
                format: options.format
            });

            spinner.succeed(chalk.green('Processing complete!'));

            // Display results
            console.log(chalk.cyan('\n📊 Results:'));
            console.log(chalk.white(`  Total items: ${result.totalItems}`));
            console.log(chalk.white(`  Groups created: ${result.groupCount}`));

            if (options.format === 'all') {
                console.log(chalk.white(`  Detailed output: ${result.detailedPath}`));
                console.log(chalk.white(`  Condensed output: ${result.condensedPath}`));
                console.log(chalk.white(`  Summary output: ${result.summaryPath}`));
            } else {
                console.log(chalk.white(`  Output file: ${result.outputPath}`));
            }

            console.log(chalk.white(`  Output format: ${options.format}\n`));

            // Display group summary
            // console.log(chalk.cyan('📋 Groups Summary:'));
            // result.groups.forEach(group => {
            //     console.log(chalk.yellow(`\n  ${group.name} (${group.memberCount} items)`));
            //     group.members.slice(0, 3).forEach(member => {
            //         console.log(chalk.gray(`    - ${member.name}`));
            //     });
            //     if (group.memberCount > 3) {
            //         console.log(chalk.gray(`    ... and ${group.memberCount - 3} more`));
            //     }
            // });

            console.log(chalk.green('\n✅ Success! Check the output file for full results.\n'));

        } catch (error) {
            spinner.fail(chalk.red('Error occurred'));
            console.error(chalk.red(`\n${error.message}\n`));

            if (error.stack && process.env.DEBUG) {
                console.error(chalk.gray(error.stack));
            }

            process.exit(1);
        }
    });

program
    .command('validate')
    .description('Validate CSV file format')
    .argument('<file>', 'Path to CSV file')
    .action(async (file) => {
        const spinner = ora('Validating file...').start();

        try {
            const filePath = path.resolve(file);
            await fs.access(filePath);

            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.trim().split('\n');

            if (lines.length < 2) {
                throw new Error('File must have at least a header row and one data row');
            }

            const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

            if (!headers.includes('id') || !headers.includes('name')) {
                throw new Error('CSV must contain "id" and "name" columns');
            }

            spinner.succeed(chalk.green('File is valid!'));
            console.log(chalk.cyan(`\n  Rows: ${lines.length - 1}`));
            console.log(chalk.cyan(`  Columns: ${headers.join(', ')}\n`));

        } catch (error) {
            spinner.fail(chalk.red('Validation failed'));
            console.error(chalk.red(`\n${error.message}\n`));
            process.exit(1);
        }
    });

program
    .command('config')
    .description('Show current configuration')
    .action(() => {
        console.log(chalk.cyan('\n⚙️  Configuration:\n'));
        console.log(chalk.white(`  API Key: ${process.env.GEMINI_API_KEY ? chalk.green('✓ Set') : chalk.red('✗ Not set')}`));
        console.log(chalk.white(`  Model: ${config.MODEL}`));
        console.log(chalk.white(`  Embedding Model: ${config.EMBEDDING_MODEL}`));
        console.log(chalk.white(`  Default Threshold: ${config.DEFAULT_THRESHOLD}\n`));
    });

program.parse();