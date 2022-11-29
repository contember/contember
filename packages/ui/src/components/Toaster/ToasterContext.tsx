import { createContext, ReactNode, useCallback, useMemo, useReducer, useState } from 'react'
import { Toast, ToastDefinition, ToastId } from './Toaster'

export const ToasterContext = createContext<{
	toasts: Toast[],
	showToast: (toast: ToastDefinition) => ToastId
	dismissToast: (toastId: ToastId) => void
} | undefined>(undefined)


type ToasterReducerAction =
	| { type: 'showToast', toast: Toast }
	| { type: 'dismissToast', toastId: ToastId }

const toasterReducer = (toasts: Toast[], action: ToasterReducerAction): Toast[] => {
	switch (action.type) {
		case 'dismissToast':
			return toasts.filter(it => it.id !== action.toastId)
		case 'showToast':
			return [...toasts, action.toast]
	}
}

export const ToasterProvider: React.FC<{ children: ReactNode }> = props => {
	const [counter, setCounter] = useState(1)
	const [toasts, dispatch] = useReducer(toasterReducer, [])

	const dismissToast = useCallback((toastId: ToastId) => {
		dispatch({ type: 'dismissToast', toastId })
	}, [])

	const showToast = useCallback((toast: ToastDefinition) => {
		const id = String(counter)
		dispatch({ type: 'showToast', toast: { ...toast, id: id } })
		setCounter(it => it + 1)
		return id
	}, [counter])

	const toasterContextValue = useMemo(() => ({
		toasts,
		dismissToast,
		showToast,
	}), [dismissToast, showToast, toasts])

	return <ToasterContext.Provider value={toasterContextValue}>{props.children}</ToasterContext.Provider>
}
