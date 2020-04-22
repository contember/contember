import { FileUploadProgress } from '@contember/client'
import { FileId } from './FileId'
import { FileUploadActionType } from './FileUploadActionType'
import { FileWithMetadata } from './FileWithMetadata'

export type FileUploadAction =
	| {
			type: FileUploadActionType.PublishNewestState
	  }
	| {
			type: FileUploadActionType.StartUploading
			files: Iterable<[[FileId, File] | File, FileWithMetadata]>
	  }
	| {
			type: FileUploadActionType.UpdateUploadProgress
			progress: Iterable<[File | FileId, FileUploadProgress]>
	  }
	| {
			type: FileUploadActionType.FinishSuccessfully
			result: Iterable<[File | FileId, any]>
	  }
	| {
			type: FileUploadActionType.FinishWithError
			error: Iterable<(File | FileId) | [File | FileId, any]>
	  }
	| {
			type: FileUploadActionType.Abort
			files: Iterable<File | FileId>
	  }
