export enum ToastType {
	Success = 'success',
	Error = 'error',
	Warning = 'warning',
	Info = 'info'
}

export interface Toast {
	type: ToastType
	message: string
}

export default interface ToastsState {
	toasts: Toast[]
}

export const emptyToastsState: ToastsState = {
	toasts: []
}
