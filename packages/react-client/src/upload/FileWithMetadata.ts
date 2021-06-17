import type { FileId } from './FileId'

export interface FileWithMetadata {
	file: File
	fileId: FileId
	abortController: AbortController
	previewUrl: string
}
