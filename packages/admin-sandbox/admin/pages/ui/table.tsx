import { UIC } from './uiel'

export const TableWrapper = UIC('div', {
	baseClass: 'relative w-full overflow-auto',
	displayName: 'TableWrapper',
})

export const Table = UIC('table', {
	baseClass: 'w-full caption-bottom text-sm',
	displayName: 'Table',
})

export const TableHeader = UIC('thead', {
	baseClass: '[&_tr]:border-b',
	displayName: 'TableHeader',
})

export const TableBody = UIC('tbody', {
	baseClass: '[&_tr:last-child]:border-0',
	displayName: 'TableBody',
})

export const TableFooter = UIC('tfoot', {
	baseClass: 'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
	displayName: 'TableFooter',
})

export const TableRow = UIC('tr', {
	baseClass: 'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
	displayName: 'TableRow',
})

export const TableHead = UIC('th', {
	baseClass: 'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
	displayName: 'TableHead',
})

export const TableCell = UIC('td', {
	baseClass: 'p-4 align-middle [&:has([role=checkbox])]:pr-0',
	displayName: 'TableCell',
})

export const TableCaption = UIC('caption', {
	baseClass: 'mt-4 text-sm text-muted-foreground',
	displayName: 'TableCaption',
})
