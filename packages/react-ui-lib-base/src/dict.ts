import { TextFilterArtifactsMatchMode } from '@contember/react-dataview'
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
	input: {
		noValue: 'No value',
	},
	datagrid: {
		na: 'N/A',
		dateStart: 'From',
		today: 'Today',
		dateEnd: 'To',
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
		placeholder: 'Select',
	},
	backButton: {
		back: 'Back',
	},

	errors: {
		required: 'This field is required',
		unique: 'This value is already taken',
		unknown: 'An unknown error has occurred',
	},

	boolean: {
		true: 'Yes',
		false: 'No',
	},
	logout: 'Log out',
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
export const dictFormat = (value: string, replacements: Record<string, string>) => {
	return value.replace(/\${([^}]+)}/g, (_, key) => replacements[key] || '')
}
