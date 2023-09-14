export const dataGridDictionary = {
	dataGrid: {
		emptyMessage: {
			text: 'No data to display.',
		},
		columnFiltering: {
			showMenuButton: {
				text: 'All filters',
			},
			heading: 'All filters',
			emptyMessage: {
				text: 'There are no active filters.',
			},
			columnColumn: {
				text: 'Column',
			},
			filterColumn: {
				text: 'Filter',
			},
			addFilterButton: {
				text: 'Add a column filter',
			},
		},
		columnHiding: {
			showMenuButton: {
				text: 'Columns',
			},
			heading: 'Columns',
		},
		paging: {
			first: 'First',
			previous: 'Previous',
			next: 'Next',
			last: 'Last',

			status: {
				unknownPageTotal: 'Page {pageNumber}',
				knownPageTotal: 'Page {pageNumber} / {totalPageCount}',
				itemCount: '({itemCount, plural, =0 {No items} =1 {# item} other {# items}})',
			},
		},
	},
}
export type DataGridDictionary = typeof dataGridDictionary
