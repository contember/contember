import { FileId } from './FileId'

export interface FileWithMetadata {
	id: FileId
	file: File
	previewUrl: string
}
