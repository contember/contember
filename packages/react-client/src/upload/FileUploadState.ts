import { FileUploadReadyState } from './FileUploadReadyState'

export type FileUploadState =
	| {
			readyState: FileUploadReadyState.Uninitialized
			file?: undefined
			previewUrl?: undefined
	  }
	| {
			readyState: FileUploadReadyState.Initializing
			file: File
			previewUrl: string
	  }
	| {
			readyState: FileUploadReadyState.Uploading
			file: File
			progress: number
			previewUrl: string
	  }
	| {
			readyState: FileUploadReadyState.Success
			file: File
			fileUrl: string
			previewUrl: string
	  }
	| {
			// TODO information about the error
			readyState: FileUploadReadyState.Error
			file: File | undefined
			previewUrl: string | undefined
	  }
