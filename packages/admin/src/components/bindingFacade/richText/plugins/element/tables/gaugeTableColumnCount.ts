import type { TableElement } from './TableElement'
import type { TableRowElement } from './TableRowElement'

export const gaugeTableColumnCount = (table: TableElement): number => {
	// This whole function is obviously very heuristic. It's intended to be called during normalizations (i.e. often),
	// and so it aims to be reasonably fast. We want to use this return value to repair corrupted tables.

	if (table.children.length === 0) {
		return 0
	}

	const rowSampleStart = table.children[0] as TableRowElement
	const rowSampleMiddle = table.children[Math.floor(table.children.length / 2)] as TableRowElement
	const rowSampleEnd = table.children[table.children.length - 1] as TableRowElement

	const columnSampleStart = rowSampleStart.children.length
	const columnSampleMiddle = rowSampleMiddle.children.length
	const columnSampleEnd = rowSampleEnd.children.length

	// Tables most often get corrupted either at the beginning or at the end. Thus we assume that out of these three
	// values, two will likely be the same.
	if (columnSampleStart === columnSampleEnd) {
		return columnSampleStart
	}
	if (columnSampleStart === columnSampleMiddle) {
		return columnSampleStart
	}
	if (columnSampleMiddle === columnSampleEnd) {
		return columnSampleMiddle
	}

	// If we make it here, then all three are different and the table is completely broken. We could consult more rows
	// but really, odds are that it wouldn't really help.
	return columnSampleStart
}
