import { TextFilterArtifactsMatchMode } from '@contember/react-dataview'
import { InviteErrorCodes } from './hooks/useInvite'

export const dict = {
	deleteEntityDialog: {
		title: 'Are you absolutely sure?',
		description: 'This action cannot be undone.',
		confirmButton: 'Delete',
		cancelButton: 'Cancel',
	},
	identityLoader: {
		fail: 'Failed to load identity',
	},
	persist: {
		persistButton: 'Save data',
		invalidInputError: 'Invalid input',
		invalidResponseError: 'Invalid response',
		invalidResponseErrorDetails: 'The server returned an invalid response. Please try again later.',
		success: 'Successfully saved',
		afterPersistError: 'Something wrong has happened after the data were persisted. Please refresh the page.',
	},
	datagrid: {
		na: 'N/A',
		dateStart: 'Start',
		dateEnd: 'End',
		numberFrom: 'From',
		numberTo: 'To',
		textReset: 'Reset filter',
		textPlaceholder: 'Search',
		textMatchMode: {
			'matches': 'Contains',
			'matchesExactly': 'Equals',
			'startsWith': 'Starts with',
			'endsWith': 'Ends with',
			'doesNotMatch': 'Does not contain',
		} satisfies Record<TextFilterArtifactsMatchMode, string>,
		columns: 'Columns',
		columnAsc: 'asc',
		columnDesc: 'desc',
		columnHide: 'Hide',
		empty: 'No results.',
		showGrid: 'Show grid',
		showTable: 'Show table',
		paginationFirstPage: 'First page',
		paginationPreviousPage: 'Previous page',
		paginationNextPage: 'Next page',
		paginationLastPage: 'Last page',
		paginationRowsPerPage: 'Rows per page',

		pageInfo: 'Page ${page} of ${pagesCount}',
		pageInfoShort: 'Page ${page}',
		pageRowsCount: '${totalCount} rows total',

		filter: 'Filter',
		exclude: 'Exclude',

	},
	select: {
		confirmNew: 'Confirm',
		cancelNew: 'Cancel',
		search: 'Search',
		paginationPreviousPage: 'Previous page',
		paginationNextPage: 'Next page',
		placeholder: 'Select',
	},

	errors: {
		unique: 'This value is already taken',
		unknown: 'An unknown error has occurred',
	},

	boolean: {
		true: 'Yes',
		false: 'No',
	},
	logout: 'Log out',
	inviteErrors: {
		ALREADY_MEMBER: 'This user is already a member of the project',
		INVALID_EMAIL_FORMAT: 'Invalid email format',
		INVALID_MEMBERSHIP: 'Invalid membership',
		PROJECT_NOT_FOUND: 'Project not found',
		ROLE_NOT_FOUND: 'Role not found',
		VARIABLE_EMPTY: 'Variable is empty',
		VARIABLE_NOT_FOUND: 'Variable not found',
		fallback: 'Failed to invite user',
	} satisfies Record<InviteErrorCodes | 'fallback',  string>,
}
