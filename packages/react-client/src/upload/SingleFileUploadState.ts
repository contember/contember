import { FileUploader, FileUploadError } from '@contember/client'
import { FileUploadReadyState } from './FileUploadReadyState'

export type SingleFileUploadState<Result = any, Error extends FileUploadError = FileUploadError> =
	| {
			readyState: FileUploadReadyState.Uploading
			file: File
			uploader: FileUploader
			abortController: AbortController
			previewUrl: string
			progress?: number
	  }
	| {
			readyState: FileUploadReadyState.Success
			file: File
			uploader: FileUploader
			previewUrl: string
			result: Result
	  }
	| {
			readyState: FileUploadReadyState.Error
			file: File
			uploader: FileUploader
			previewUrl: string
			error: Error | undefined
	  }
	| {
			readyState: FileUploadReadyState.Aborted
			file: File
			uploader: FileUploader
			previewUrl: string
			progress?: number
	  }
