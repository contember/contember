import { FileId } from './FileId'
import { SingleFileUploadState } from './SingleFileUploadState'

export type FileUploadCompoundState = Map<FileId, SingleFileUploadState>
