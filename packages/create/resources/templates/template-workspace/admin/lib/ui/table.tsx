import { uic } from '../utils'

export const TableWrapper = uic('div', {
	baseClass: 'relative w-full overflow-auto',
	displayName: 'TableWrapper',
})

export const Table = uic('table', {
	baseClass: 'w-full caption-bottom text-sm',
	displayName: 'Table',
})

export const TableHeader = uic('thead', {
	baseClass: '[&_tr]:border-b',
	displayName: 'TableHeader',
})

export const TableBody = uic('tbody', {
	baseClass: '[&_tr:last-child]:border-0',
	displayName: 'TableBody',
})

export const TableFooter = uic('tfoot', {
	baseClass: 'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
	displayName: 'TableFooter',
})

export const TableRow = uic('tr', {
	baseClass: 'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
	displayName: 'TableRow',
})

export const TableHead = uic('th', {
	baseClass: 'px-4 py-3 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
	displayName: 'TableHead',
})

export const TableCell = uic('td', {
	baseClass: 'px-4 py-3 align-middle [&:has([role=checkbox])]:pr-0',
	displayName: 'TableCell',
})

export const TableCaption = uic('caption', {
	baseClass: 'mt-4 text-sm text-muted-foreground',
	displayName: 'TableCaption',
})
