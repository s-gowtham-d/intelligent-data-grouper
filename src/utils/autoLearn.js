import fs from 'fs';
import { config } from '../config.js';
import { fuzzyIncludes } from './fuzzy.js';

const CONFIG_PATH = './configGroupNames.js';

export function autoLearnCategory(groupName, memberNames) {
    const keywords = config.CATEGORY_KEYWORDS[groupName] || [];

    for (const name of memberNames) {
        const words = name.toLowerCase().split(/\s+/);

        for (const word of words) {
            if (word.length < 4) continue;

            const alreadyExists = keywords.some(k =>
                fuzzyIncludes(k, word) || fuzzyIncludes(word, k)
            );

            if (!alreadyExists) {
                keywords.push(word);
            }
        }
    }

    config.CATEGORY_KEYWORDS[groupName] = keywords;

    persistUpdatedConfig(config);
}

function persistUpdatedConfig(updatedConfig) {
    const newContent =
        `export const config = ${JSON.stringify(updatedConfig, null, 4)};\n`;

    fs.writeFileSync(CONFIG_PATH, newContent, 'utf-8');
}
