import { FileUploadProgress, FileUploadResult } from './uploadClient'
import { FileWithMeta } from './file'

export type UploaderFileStateInitial = { state: 'initial'; file: FileWithMeta }
export type UploaderFileStateUploading = { state: 'uploading'; file: FileWithMeta; progress: FileUploadProgress }
export type UploaderFileStateFinalizing = { state: 'finalizing'; file: FileWithMeta; result: FileUploadResult }
export type UploaderFileStateSuccess = { state: 'success'; file: FileWithMeta; result: FileUploadResult; dismiss: () => void }
export type UploaderFileStateError = { state: 'error'; file: FileWithMeta; error: unknown; dismiss: () => void }

export type UploaderFileState =
	| UploaderFileStateInitial
	| UploaderFileStateUploading
	| UploaderFileStateFinalizing
	| UploaderFileStateSuccess
	| UploaderFileStateError

export type UploaderState = UploaderFileState[]
