export enum AccessorTreeStateActionType {
	Uninitialize = 'uninitialize',

	SetDirtiness = 'setDirtiness',
	SetData = 'setData',

	InitializeQuery = 'initializeQuery',
	InitializeMutation = 'initializeMutation',
	ResolveRequestWithError = 'resolveRequestWithError',
}
