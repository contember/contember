import type { FileId } from './FileId'
import type { SingleFileUploadState } from './SingleFileUploadState'

export type FileUploadCompoundState = Map<FileId, SingleFileUploadState>
