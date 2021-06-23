export const uploadDictionary = {
	upload: {
		emptyMessage: {
			text: 'No files uploaded',
		},
		addButton: {
			text: 'Select files to upload',
			subText: 'or drag & drop',
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
