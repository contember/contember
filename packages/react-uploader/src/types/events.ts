import { FileUploadProgress, FileUploadResult } from '../uploadClient'
import { FileWithMeta } from './file'
import { FileType } from './type'

export type BeforeUploadEvent = {
	file: FileWithMeta
	reject: (reason: string) => never
}

export type StartUploadEvent = {
	file: FileWithMeta
	fileType: FileType
}

export type ProgressEvent = {
	file: FileWithMeta
	progress: FileUploadProgress
	fileType: FileType
}

export type SuccessEvent = {
	file: FileWithMeta
	result: FileUploadResult
	fileType: FileType
}

export type AfterUploadEvent = {
	file: FileWithMeta
	result: FileUploadResult
	fileType: FileType
}

export type ErrorEvent = {
	file: FileWithMeta
	error: unknown
	fileType?: FileType
}

export type UploaderEvents = {
	onBeforeUpload: (event: BeforeUploadEvent) => Promise<FileType | undefined>
	onStartUpload: (event: StartUploadEvent) => void
	onProgress: (event: ProgressEvent) => void
	onAfterUpload: (event: AfterUploadEvent) => Promise<void> | void
	onSuccess: (event: SuccessEvent) => void
	onError: (event: ErrorEvent) => void
}
