import { ToastDefinition, ToastId } from '../../state/toasts'

export interface PersistInfoPublicProps {
	displayToast?: boolean
	timeout?: number
	successMessage?: string
	errorMessage?: string
}

export interface PersistInfoControls {
	showMessage: (toast: ToastDefinition) => ToastId | undefined
	dismissMessage: (toastId: ToastId) => void
}
