export enum ToastType {
	Success = 'success',
	Error = 'error',
	Warning = 'warning',
	Info = 'info',
}

export type ToastId = string

export interface ToastDefinition {
	type: ToastType
	message: string
}

export interface Toast extends ToastDefinition {
	id: ToastId
}

export default interface ToastsState {
	toasts: Toast[]
}

export const emptyToastsState: ToastsState = {
	toasts: [],
}
