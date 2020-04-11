export enum FileUploadActionType {
	PublishNewestState = 'publishNewestState',
	StartUploading = 'startUploading',
	UpdateUploadProgress = 'updateProgress',
	FinishSuccessfully = 'finishSuccessfully',
	FinishWithError = 'finishWithError',
	Abort = 'abort',
}
