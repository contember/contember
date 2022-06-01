export const uploadDictionary = {
	upload: {
		addButton: {
			text: 'Select files to upload',
			subText: 'or drag & drop',
		},
		selectButton: {
			text: 'Select uploaded files',
		},
		selectModal: {
			maxLimitReached: 'Maximum amount of items reached',
		},
		insertSelected: {
			text: 'Insert selected',
		},
		fileState: {
			inspectingFile: 'Inspecting file…',
			invalidFile: 'Invalid file',
			failedUpload: 'Upload failed',
			finalizing: 'Finalizing…',
		},
	},
}
export type UploadDictionary = typeof uploadDictionary
