import { createRequiredContext } from '@contember/react-utils'
import { ReactNode, useCallback, useMemo, useState } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

const TIMEOUT_BY_TYPE: {
	[K in ToastType]: number
} = {
	error: 60000,
	warning: 15000,
	info: 6000,
	success: 6000,
}

export interface ToastData {
	id: number
	type: ToastType
	content: ReactNode
}

export interface ToasterState {
	toasts: ToastData[]
}

export interface ToasterMethods {
	showToast(content: ReactNode, options?: ToastOptions): ToastMethods
	clear(): void
}

export interface ToastOptions {
	dismiss?: number
	type?: ToastType
}

export interface ToastMethods {
	dismiss(): void
	updateContent(content: ReactNode): void
}

export const [ToasterStateContext, useToasterState] = createRequiredContext<ToasterState>('ToasterStateContext')
export const [ToasterMethodsContext, useToasterMethods] = createRequiredContext<ToasterMethods>('ToasterMethodsContext')

export const useToasts = () => {
	const state = useToasterState()
	return state.toasts
}
export const useShowToast = () => {
	const methods = useToasterMethods()
	return methods.showToast
}

const genId = (() => {
	let id = 0
	return () => ++id
})()

export const ToasterProvider = ({ children }: {
	children: ReactNode
}) => {
	const [toasts, setToasts] = useState<ToastData[]>([])

	const showToast = useCallback((content: ReactNode, options?: ToastOptions): ToastMethods => {
		const id = genId()
		const type = options?.type ?? 'info'
		const toast: ToastData = {
			id,
			type,
			content,
		}
		setToasts(toasts => [...toasts, toast])
		const dismissMs = options?.dismiss ?? TIMEOUT_BY_TYPE[type]

		const dismiss = () => {
			setToasts(toasts => toasts.filter(t => t.id !== id))
		}

		if (dismissMs > 0) {
			setTimeout(dismiss, dismissMs)
		}


		return {
			dismiss,
			updateContent: content => {
				setToasts(toasts => toasts.map(t => (t.id === id ? { ...t, content } : t)))
			},
		}
	}, [])

	const clear = useCallback(() => {
		setToasts([])
	}, [])

	const methods = useMemo<ToasterMethods>(() => ({ showToast, clear }), [showToast, clear])
	const state = useMemo<ToasterState>(() => ({ toasts }), [toasts])

	return (
		<ToasterStateContext.Provider value={state}>
			<ToasterMethodsContext.Provider value={methods}>
				{children}
			</ToasterMethodsContext.Provider>
		</ToasterStateContext.Provider>
	)
}
