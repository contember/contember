import type { AdminDictionary } from '@contember/admin'

export const csCZ: AdminDictionary = {
	dataGrid: {
		emptyMessage: {
			text: 'Žádné položky.',
		},
		columnFiltering: {
			showMenuButton: {
				text: 'Všechny filtry',
			},
			heading: 'Všechny filtry',
			emptyMessage: {
				text: 'Žádné aktivní filtry.',
			},
			columnColumn: {
				text: 'Sloupec',
			},
			filterColumn: {
				text: 'Filtr',
			},
			addFilterButton: {
				text: 'Přidat filtr',
			},
		},
		columnHiding: {
			showMenuButton: {
				text: 'Sloupce',
			},
			heading: 'Sloupce',
		},
		paging: {
			first: 'První',
			previous: 'Předchozí',
			next: 'Následující',
			last: 'Poslední',

			status: {
				unknownPageTotal: 'Strana {pageNumber}',
				knownPageTotal: 'Strana {pageNumber} z {totalPageCount}',
				itemCount: '({itemCount, plural, =0 {Žádné položky} one {# položka} few {# položky} other {# položek}})',
			},
		},
	},
	repeater: {
		addButton: {
			text: 'Přidat další',
		},
		emptyMessage: {
			text: 'Nic tu není. Zkuste přidat novou položku.',
		},
	},
}
