import { FileUploadReadyState } from './FileUploadReadyState'

export type FileUploadState =
	| {
			readyState: FileUploadReadyState.Uninitialized
			previewUrl?: undefined
	  }
	| {
			readyState: FileUploadReadyState.Initializing
			previewUrl: string
	  }
	| {
			readyState: FileUploadReadyState.Uploading
			progress: number
			previewUrl: string
	  }
	| {
			readyState: FileUploadReadyState.Success
			fileUrl: string
			previewUrl: string
	  }
	| {
			// TODO information about the error
			readyState: FileUploadReadyState.Error
			previewUrl: string | undefined
	  }
