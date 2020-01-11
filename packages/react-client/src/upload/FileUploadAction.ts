import { FileId } from './FileId'
import { FileUploadActionType } from './FileUploadActionType'
import { FileIdWithMetadata } from './FileIdWithMetadata'

export type FileUploadAction =
	| {
			type: FileUploadActionType.PublishNewestState
	  }
	| {
			type: FileUploadActionType.Uninitialize
			fileIds: FileId[]
	  }
	| {
			type: FileUploadActionType.Initialize
			filesWithMetadata: FileIdWithMetadata[]
	  }
	| {
			type: FileUploadActionType.StartUploading
			fileIds: FileId[]
	  }
	| {
			type: FileUploadActionType.UpdateUploadProgress
			fileId: FileId
			progress: number
	  }
	| {
			type: FileUploadActionType.FinishSuccessfully
			fileId: FileId
			fileUrl: string
	  }
	| {
			type: FileUploadActionType.FinishWithError
			fileIds: FileId[]
	  }
