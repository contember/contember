import type { FileUploadProgress } from '@contember/client'
import type { FileId } from './FileId'
import type { FileUploadActionType } from './FileUploadActionType'
import type { FileWithMetadata } from './FileWithMetadata'

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
