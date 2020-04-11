import { FileUploadProgress } from '@contember/client'
import { InternalFileMetadata } from './InternalFileMetadata'
import { FileUploadActionType } from './FileUploadActionType'

export type FileUploadAction =
	| {
			type: FileUploadActionType.PublishNewestState
	  }
	| {
			type: FileUploadActionType.StartUploading
			files: Iterable<[File, InternalFileMetadata]>
	  }
	| {
			type: FileUploadActionType.UpdateUploadProgress
			progress: Iterable<[File, FileUploadProgress]>
	  }
	| {
			type: FileUploadActionType.FinishSuccessfully
			result: Iterable<[File, any]>
	  }
	| {
			type: FileUploadActionType.FinishWithError
			error: Iterable<[File, any]>
	  }
	| {
			type: FileUploadActionType.Abort
			files: Iterable<File>
	  }
