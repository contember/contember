export const dataGridCellsDictionary = {
	dataGridCells: {
		booleanCell: {
			includeTrue: 'Yes',
			includeFalse: 'No',
			includeNull: 'N/A',
		},
		enumCell: {
			includeNull: 'Include N/A',
		},
		dateCell: {
			fromLabel: 'From',
			toLabel: 'To',
		},
		textCell: {
			matches: 'Contains',
			doesNotMatch: "Doesn't contain",
			matchesExactly: 'Matches exactly',
			startsWith: 'Starts with',
			endsWith: 'Ends with',

			queryPlaceholder: 'Query',

			includeNull: '<strong>Include</strong> N/A',
			excludeNull: '<strong>Exclude</strong> N/A',
		},
		numberCell: {
			equals: 'Equals',
			greaterThan: 'Greater than',
			lessThan: 'Less than',
		},
	},
}
export type DataGridCellsDictionary = typeof dataGridCellsDictionary
