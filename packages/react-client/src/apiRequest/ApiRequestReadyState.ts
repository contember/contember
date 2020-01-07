// It is crucial to keep in mind that this describes just the *request* as in the bare data transfer. Therefore,
// the 'Success' state may still describe a request that didn't _succeed_ per se, due to e.g. a wrong password
// having been input.
export enum ApiRequestReadyState {
	Uninitialized = 'Uninitialized',
	Pending = 'Pending',
	Success = 'Success',
	Error = 'Error',
}
