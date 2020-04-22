import { GraphQlClient } from '../../graphQlClient'
import { FileUploadError } from './FileUploadError'
import { FileUploadProgress } from './FileUploadProgress'
import { UploadedFileMetadata } from './UploadedFileMetadata'

export interface FileUploader<Result = any, Error extends FileUploadError = FileUploadError> {
	upload: (files: Map<File, UploadedFileMetadata>, options: FileUploaderInitializeOptions) => Promise<void>
}

export interface FileUploaderInitializeOptions<Result = any, Error extends FileUploadError = FileUploadError> {
	client?: GraphQlClient
	contentApiToken?: string | undefined
	onSuccess: (result: Iterable<[File, Result]>) => void
	onError?: (error: Iterable<File | [File, Error]>) => void
	onProgress?: (progress: Iterable<[File, FileUploadProgress]>) => void
}
