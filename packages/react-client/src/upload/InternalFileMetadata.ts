import { FileUploader } from '@contember/client'

export interface InternalFileMetadata {
	abortController: AbortController
	previewUrl: string
	uploader: FileUploader
}
