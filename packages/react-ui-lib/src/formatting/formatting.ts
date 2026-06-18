import { SchemaColumn } from '@contember/interface'
import { dict } from '@contember/react-ui-lib-base'

/**
 * Formats a date string into a localized date format.
 *
 * Converts ISO date strings to human-readable date format using browser locale settings.
 * Handles null values gracefully.
 *
 * ## Example
 * ```ts
 * formatDate('2023-10-05') // '10/5/2023' (en-US locale)
 * ```
 */
export const formatDate = (date: string | null) => {
	if (date === null) {
		return null
	}
	const d = new Date(date)
	return d.toLocaleDateString()
}

/**
 * Formats a date string with a time component in a localized format.
 *
 * Shows both date and time including hours, minutes, and seconds. Respects system timezone.
 *
 * ## Example
 * ```ts
 * formatDateTime('2023-10-05T14:30:00') // '10/5/2023, 2:30:00 PM'
 * ```
 */
export const formatDateTime = (date: string | null) => {
	if (date === null) {
		return null
	}
	const d = new Date(date)
	return d.toLocaleString()
}

/**
 * Converts boolean values to localized strings using the application dictionary.
 *
 * Returns null for null input.
 *
 * ## Example
 * ```ts
 * formatBoolean(true) // 'Yes' (depending on dict)
 * ```
 */
export const formatBoolean = (value: boolean | null) => {
	if (value === null) {
		return null
	}
	return value ? dict.boolean.true : dict.boolean.false
}

/**
 * Factory function that creates an enum value to label converter.
 *
 * Maps enum keys to human-readable labels. Handles null values and is case-sensitive.
 *
 * ## Example
 * ```ts
 * const formatStatus = createEnumFormatter({ DRAFT: 'Draft', PUBLISHED: 'Published' })
 * formatStatus('DRAFT') // 'Draft'
 * ```
 */
export const createEnumFormatter = (enumValues: Record<string, string>) => (value: string | null) => {
	if (value === null) {
		return null
	}
	return enumValues[value]
}

/**
 * Wraps a formatter to provide a fallback value for null inputs.
 *
 * ## Example
 * ```ts
 * const safeFormat = withFallback(formatDate, 'Unknown date')
 * safeFormat(null) // 'Unknown date'
 * ```
 */
export const withFallback = <T>(formatter: (value: T) => string, fallback: string) => (value: T | null) => {
	if (value === null) {
		return fallback
	}
	return formatter(value)
}

/**
 * Formats numbers with locale-aware thousand separators.
 *
 * Handles integers and floats. Respects browser locale.
 *
 * ## Example
 * ```ts
 * formatNumber(1234.5) // '1,234.5' (en-US)
 * ```
 */
export const formatNumber = (value: number | null) => {
	if (value === null) {
		return null
	}
	return value.toLocaleString()
}

/**
 * Converts raw byte counts to human-readable file sizes.
 *
 * Automatically selects the appropriate unit (KB, MB, GB, etc.) and supports configurable decimal precision.
 *
 * ## Example
 * ```ts
 * formatBytes(2048) // '2.0 KB'
 * ```
 */
export const formatBytes = (bytes: number, decimals = 1) => {
	if (bytes === 0) return '0 Bytes'
	const k = 1024
	const dm = decimals + 1 || 3
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Converts a duration in seconds to `mm:ss` format.
 *
 * Pads seconds with a leading zero. Handles durations over 60 minutes correctly.
 *
 * ## Example
 * ```ts
 * formatDuration(125) // '2:05'
 * ```
 */
export const formatDuration = (duration: number) => {
	const minutes = Math.floor(duration / 60)
	const seconds = duration % 60
	return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Pretty-prints a JSON value with 2-space indentation.
 *
 * ## Example
 * ```ts
 * formatJson({ key: 'value' }) // '{\n  "key": "value"\n}'
 * ```
 */
export const formatJson = (value: any) => {
	return JSON.stringify(value, null, 2)
}

/**
 * Selects the appropriate formatter based on a schema column type.
 *
 * Mapping:
 * - `Date` → {@link formatDate}
 * - `DateTime` → {@link formatDateTime}
 * - `Bool` → {@link formatBoolean}
 * - `Integer` / `Float` → {@link formatNumber}
 * - `Json` → {@link formatJson}
 * - Other → identity formatter
 *
 * ## Example
 * ```ts
 * getFormatter({ type: 'Date' })('2023-10-05') // formatted date string
 * ```
 */
export const getFormatter = (schema: SchemaColumn) => {
	switch (schema.type) {
		case 'Date':
			return formatDate
		case 'DateTime':
			return formatDateTime
		case 'Bool':
			return formatBoolean
		case 'Integer':
		case 'Float':
			return formatNumber
		case 'Json':
			return formatJson
		default:
			return (value: any) => value
	}
}
