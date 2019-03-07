export enum UploadStatus {
	PREPARING,
	UPLOADING,
	FINISHED,
	FAILED
}

export interface Upload {
	status: UploadStatus
	name: string
	size: number
	mime: string
	objectURL?: string
}

export interface UploadPreparing extends Upload {
	status: UploadStatus.PREPARING
}

export interface UploadUploading extends Upload {
	status: UploadStatus.UPLOADING
	progress: number | null
}

export interface UploadFinished extends Upload {
	status: UploadStatus.FINISHED
	resultUrl: string
}

export interface UploadFailed extends Upload {
	status: UploadStatus.FAILED
	reason: string
}

export type AnyUpload = UploadPreparing | UploadUploading | UploadFinished | UploadFailed

export default interface UploadState {
	uploads: { [key: string]: AnyUpload }
}

export const emptyUploadState: UploadState = {
	uploads: {}
}
