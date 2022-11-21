import type { AdminDictionary } from '@contember/admin'

export const csCZ: AdminDictionary = {
	blockRepeater: {
		addNewBlockButton: {
			addBlock: 'Přidat blok',
		},
	},
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
	dataGridCells: {
		booleanCell: {
			includeTrue: 'Ano',
			includeFalse: 'Ne',
			includeNull: 'Neznámé',
		},
		enumCell: {
			includeNull: 'Neznámé',
		},
		dateCell: {
			fromLabel: 'Od',
			toLabel: 'Do',
		},
		textCell: {
			matches: 'Obsahuje',
			doesNotMatch: 'Neobsahuje',
			matchesExactly: 'Přesně odpovídá',
			startsWith: 'Začíná na',
			endsWith: 'Končí na',

			queryPlaceholder: 'Hledaný výraz',

			includeNull: '<strong>Zahrnout</strong> prázdné',
			excludeNull: '<strong>Vynechat</strong> prázdné',
		},
		numberCell: {
			equals: 'Rovná se',
			greaterThan: 'Větší než',
			lessThan: 'Menší než',
		},
	},
	errorCodes: {
		fieldRequired: 'Vyplňte prosím toto pole.',
		notUnique: 'Hodnota není unikátní.',
		unknownExecutionError: 'Neznámá chyba.',
	},
	fieldView: {
		boolean: {
			yes: 'Ano',
			no: 'Ne',
		},
		fallback: {
			unknown: 'Neznámé',
			notAvailable: 'Prázdné',
		},
	},
	persistFeedback: {
		successMessage: 'Úspěšně uloženo!',
		errorMessage: 'Při ukládání došlo k chybě. Zkuste to prosím znovu.',
		afterPersistErrorMessage: 'Po úspěšném uložení dat došlo k chybě. Obnovte, prosím, stránku.',
	},
	repeater: {
		addButton: {
			text: 'Přidat další',
		},
		emptyMessage: {
			text: 'Nic tu není. Zkuste přidat novou položku.',
		},
	},
	upload: {
		addButton: {
			text: 'Vyberte soubory z disku',
			subText: 'nebo je sem přetáhněte',
		},
		selectButton: {
			text: 'Vyberte nahrané soubory',
		},
		selectModal: {
			maxLimitReached: 'Bylo dosaženo maximálního počtu položek',
		},
		insertSelected: {
			text: 'Vložit vybrané',
		},
		fileState: {
			inspectingFile: 'Zkoumám soubor…',
			invalidFile: 'Chybný soubor',
			failedUpload: 'Nahrávání selhalo',
			finalizing: 'Dokončuji…',
		},
	},
	editorBlock: {
		editorBlockBoundary: {
			newParagraph: 'Nový odstavec',
		},
	},
	choiceField: {
		createNew: {
			confirmButtonText: 'OK',
			cancelButtonText: 'Zrušit',
			dialogTitle: 'Nová položka',
		},
	},
}
