import { TextFilterArtifactsMatchMode } from '@contember/react-dataview'
import { InviteErrorCodes } from './hooks/useInvite'
import { UploaderErrorType } from '@contember/react-uploader'

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
		invalidInputError: 'Failed to save data',
		invalidResponseError: 'Invalid response',
		invalidResponseErrorDetails: 'The server returned an invalid response. Please try again later.',
		success: 'Successfully saved',
		afterPersistError: 'Something wrong has happened after the data were persisted. Please refresh the page.',
	},
	toast: {
		showDetails: 'Show details',
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
			'matches': 'contains',
			'matchesExactly': 'equals',
			'startsWith': 'starts with',
			'endsWith': 'ends with',
			'doesNotMatch': 'does not contain',
		} satisfies Record<TextFilterArtifactsMatchMode, string>,
		visibleFields: 'Fields',
		columnAsc: 'asc',
		columnDesc: 'desc',
		columnHide: 'Hide',
		empty: 'No results.',
		layout: 'Layout',
		showGrid: 'Grid',
		showTable: 'Table',
		paginationFirstPage: 'First page',
		paginationPreviousPage: 'Previous page',
		paginationNextPage: 'Next page',
		paginationLastPage: 'Last page',
		paginationRowsPerPage: 'Rows per page',

		pageInfo: 'Page ${page} of ${pagesCount}',
		pageInfoShort: 'Page ${page}',
		pageRowsCount: '${totalCount} rows total',

		filter: 'Filter',
		filters: 'Filters',
		exclude: 'Exclude',
		export: 'Export',

	},
	select: {
		confirmNew: 'Confirm',
		cancelNew: 'Cancel',
		search: 'Search',
		paginationPreviousPage: 'Previous page',
		paginationNextPage: 'Next page',
		placeholder: 'Select',
	},
	backButton: {
		back: 'Back',
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
	uploader: {
		uploadErrors: {
			httpError: 'HTTP error',
			aborted: 'Upload aborted',
			networkError: 'Network error',
			timeout: 'Upload timeout',
			fileRejected: 'File rejected',
		} satisfies Record<UploaderErrorType, string>,
		uploaderUnknownError: 'Unknown error',

		browseFiles: 'Browse',
		dropFiles: 'Drop files here',
		or: 'or',
	},
	repeater: {
		empty: 'No items.',
		addItem: 'Add item',
	},
	outdatedApplication: {
		title: 'An updated version is available',
		description: 'To access the latest features and improvements, kindly refresh your browser.',
		warning: 'Any unsaved data will be lost. Please save your work before refreshing.',
		snooze: 'Snooze',
		refreshNow: 'Refresh now',

	},
}
