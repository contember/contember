const isHighSurrogate = (code: number): boolean => code >= 0xd800 && code <= 0xdbff

/**
 * Keeps at most `maxLength` UTF-16 code units of the text and appends a marker with the original length.
 * A surrogate pair is never split: jsonb rejects a lone surrogate, which would fail the whole event log write.
 */
export const truncateText = (text: string, maxLength: number): string => {
	if (text.length <= maxLength) {
		return text
	}
	const end = maxLength > 0 && isHighSurrogate(text.charCodeAt(maxLength - 1)) ? maxLength - 1 : maxLength
	return `${text.slice(0, end)}… [truncated, ${text.length} characters in total]`
}
