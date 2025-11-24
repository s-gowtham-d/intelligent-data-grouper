import levenshtein from 'js-levenshtein';

export function fuzzyIncludes(word, keyword, threshold = 0.7) {
    word = word.toLowerCase();
    keyword = keyword.toLowerCase();

    if (word.includes(keyword)) return true;

    const dist = levenshtein(word, keyword);
    const maxLen = Math.max(word.length, keyword.length);
    const score = 1 - dist / maxLen;

    return score >= threshold;
}

export function fuzzyMatchAny(text, keywords) {
    return keywords.some(k => fuzzyIncludes(text, k));
}
