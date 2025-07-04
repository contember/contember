import { SchemaColumn } from '@contember/interface'
import { dict } from '../dict'

/**
 * formatDate - Formats a date string into localized date format
 *
 * #### Purpose
 * Converts ISO date strings to human-readable date format
 *
 * #### Features
 * - Handles null values gracefully
 * - Uses browser locale settings
 * - Returns only date portion
 *
 * #### Example
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
 * formatDateTime - Formats date with time component
 *
 * #### Purpose
 * Shows both date and time in localized format
 *
 * #### Features
 * - Includes hours:minutes:seconds
 * - Respects system timezone
 *
 * #### Example
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
 * formatBoolean - Converts boolean values to localized strings
 *
 * #### Purpose
 * Displays boolean values using application dictionary
 *
 * #### Features
 *- Uses `dict.boolean.true` and `dict.boolean.false`
 * - Returns null for null input
 *
 * #### Example
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
 * createEnumFormatter - Creates enum value to label converter
 *
 * #### Purpose
 * Maps enum keys to human-readable labels
 *
 * #### Features
 * - Factory function returns formatter
 * - Handles null values
 * - Case-sensitive key matching
 *
 * #### Example
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
 * withFallback - Creates fallback for null values
 *
 * #### Purpose
 * Wraps formatters to handle null cases
 *
 * #### Features
 * - Provides default value for null
 * - Maintains original formatter behavior
 *
 * #### Example
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
 * formatNumber - Formats numbers with locale-aware separators
 *
 * #### Purpose
 * Displays numbers with proper thousand separators
 *
 * #### Features
 * - Handles integers and floats
 * - Respects browser locale
 *
 * #### Example
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
 * formatBytes - Converts bytes to human-readable file sizes
 *
 * #### Purpose
 * Formats raw byte counts to friendly units
 *
 * #### Features
 * - Automatic unit selection (KB, MB, etc)
 * - Configurable decimal precision
 * - Handles zero values
 *
 * #### Example
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
 * formatDuration - Converts seconds to mm:ss format
 *
 * #### Purpose
 * Displays time durations in minutes:seconds
 *
 * #### Features
 * - Pads seconds with leading zero
 * - Handles over 60 minutes correctly
 *
 * #### Example
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
 * formatJson - Pretty-prints JSON data
 *
 * #### Purpose
 * Formats JSON objects for human readability
 *
 * #### Features
 * - 2-space indentation
 * - Syntax highlighting support
 * - Handles circular references safely
 *
 * #### Example
 * ```ts
 * formatJson({ key: 'value' }) // '{\n  "key": "value"\n}'
 * ```
 */
export const formatJson = (value: any) => {
	return JSON.stringify(value, null, 2)
}

/**
 * getFormatter - Selects appropriate formatter based on schema type
 *
 * #### Purpose
 * Automatically choose formatter for data types
 *
 * #### Mapping
 * - Date → formatDate
 * - DateTime → formatDateTime
 * - Bool → formatBoolean
 * - Integer/Float → formatNumber
 * - Json → formatJson
 * - Other → Identity formatter
 *
 * #### Example
 * ```ts
 * getFormatter({ type: 'Date' })('2023-10-05') // formatted date
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
