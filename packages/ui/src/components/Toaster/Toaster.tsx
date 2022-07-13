import { ReactNode, useContext } from 'react'
import { useComponentClassName } from '../../auxiliary'
import { Intent } from '../../types'
import { Button } from '../Forms'
import { Icon } from '../Icon'
import { Message } from '../Message'
import { ToasterContext } from './ToasterContext'

export type ToastType = 'success' | 'error' | 'warning' | 'info'
export type ToastId = string

export interface ToastDefinition {
	type: ToastType
	message: ReactNode
}

export interface Toast extends ToastDefinition {
	id: ToastId
}


const toastTypeToIntent: { [K in ToastType]: Intent } = {
	success: 'success',
	warning: 'warn',
	error: 'danger',
	info: 'positive',
}

export const Toaster: React.FC = () => {
	const toasterContext = useContext(ToasterContext)
	if (!toasterContext) {
		throw new Error('Toaster context is not initialized')
	}

	const componentClassName = useComponentClassName('toaster')

	return (
		<div className={componentClassName}>
			<div className={`${componentClassName}-inner`}>
				{toasterContext.toasts.map(toast => (
					<div key={toast.id} className={`${componentClassName}-item`}>
						<Message
							intent={toastTypeToIntent[toast.type]}
							flow="block"
							lifted
							distinction="striking"
							action={
								<Button
									distinction="seamless"
									flow="squarish"
									onClick={() => {
										toasterContext.dismissToast(toast.id)
									}}
								>
									<Icon blueprintIcon="cross" />
								</Button>
							}
						>
							{toast.message}
						</Message>
					</div>
				))}
			</div>
		</div>
	)
}
