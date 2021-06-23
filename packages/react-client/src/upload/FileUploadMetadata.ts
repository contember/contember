import type { FileUploader } from '@contember/client'

export interface FileUploadMetadata<Metadata = undefined> {
	uploader: FileUploader
	metadata: Metadata | undefined
}
