import type { FileUploader } from '@contember/client'

export interface FileWithMetadata {
	file: File
	abortController: AbortController
	previewUrl: string
	uploader: FileUploader
}
