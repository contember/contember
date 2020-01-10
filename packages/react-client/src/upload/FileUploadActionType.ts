export enum FileUploadActionType {
	PublishNewestState = 'publishNewestState',
	Uninitialize = 'uninitialize',
	Initialize = 'initialize',
	StartUploading = 'startUploading',
	UpdateUploadProgress = 'updateProgress',
	FinishSuccessfully = 'finishSuccessfully',
	FinishWithError = 'finishWithError',
}
