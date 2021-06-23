import type { FileId } from './FileId'
import type { SingleFileUploadState } from './SingleFileUploadState'

export type FileUploadCompoundState<Result = unknown, Metadata = undefined> = Map<
	FileId,
	SingleFileUploadState<Result, Metadata>
>
