import { FileId } from './FileId'
import { FileUploadState } from './FileUploadState'

export type FileUploadCompoundState = {
	[fileId in FileId]: FileUploadState
}
