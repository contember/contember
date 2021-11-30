export const regexpQuote = (regexp: string) =>	regexp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
