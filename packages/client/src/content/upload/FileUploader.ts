import { GraphQlClient } from '../../graphQlClient'
import { FileUploadProgress } from './FileUploadProgress'
import { UploadedFileMetadata } from './UploadedFileMetadata'

export interface FileUploader {
	upload: (files: Map<File, UploadedFileMetadata>, options: FileUploaderInitializeOptions) => Promise<void>
}

export interface FileUploaderInitializeOptions {
	client?: GraphQlClient
	contentApiToken?: string | undefined
	onSuccess: (result: Iterable<[File, any]>) => void
	onError?: (error: Iterable<[File, any]>) => void
	onProgress?: (progress: Iterable<[File, FileUploadProgress]>) => void
}
