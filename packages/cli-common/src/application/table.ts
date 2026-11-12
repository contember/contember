import { stripVTControlCharacters } from 'node:util'
import { style } from './colors.js'

export interface TableColumn<Field extends string> {
	readonly field: Field
	readonly name: string
}

const visibleLength = (text: string): number => stripVTControlCharacters(text).length

const pad = (text: string, width: number): string => text + ' '.repeat(Math.max(width - visibleLength(text), 0))

/** Renders an ASCII table with bold headers; widths ignore ANSI styling in the cells. */
export const formatTable = <Field extends string>(
	columns: readonly TableColumn<Field>[],
	rows: readonly Partial<Record<Field, string>>[],
): string => {
	const headers = columns.map(column => style('bold', column.name))
	const widths = columns.map((column, index) =>
		rows.reduce((width, row) => Math.max(width, visibleLength(row[column.field] ?? '')), visibleLength(headers[index]))
	)
	const separator = `+${widths.map(width => '-'.repeat(width + 2)).join('+')}+`
	const line = (cells: readonly string[]): string => `| ${cells.map((cell, index) => pad(cell, widths[index])).join(' | ')} |`
	return [
		separator,
		line(headers),
		separator,
		...rows.map(row => line(columns.map(column => row[column.field] ?? ''))),
		separator,
	].join('\n')
}
