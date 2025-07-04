import { SchemaColumn } from '@contember/interface';

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
export declare const createEnumFormatter: (enumValues: Record<string, string>) => (value: string | null) => string | null;

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
export declare const formatBoolean: (value: boolean | null) => string | null;

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
export declare const formatBytes: (bytes: number, decimals?: number) => string;

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
export declare const formatDate: (date: string | null) => string | null;

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
export declare const formatDateTime: (date: string | null) => string | null;

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
export declare const formatDuration: (duration: number) => string;

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
export declare const formatJson: (value: any) => string;

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
export declare const formatNumber: (value: number | null) => string | null;

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
export declare const getFormatter: (schema: SchemaColumn) => ((date: string | null) => string | null) | ((value: boolean | null) => string | null) | ((value: number | null) => string | null) | ((value: any) => any);

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
export declare const withFallback: <T>(formatter: (value: T) => string, fallback: string) => (value: T | null) => string;

export { }
