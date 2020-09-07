export type ToastType = 'success' | 'error' | 'warning' | 'info'
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
