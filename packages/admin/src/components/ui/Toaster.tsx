import { Button, Icon, Intent, Message, MessageProps } from '@contember/ui'
import { PureComponent } from 'react'
import { connect } from 'react-redux'
import { dismissToast } from '../../actions/toasts'
import type { Dispatch } from '../../actions/types'
import type State from '../../state'
import type ToastsState from '../../state/toasts'
import type { ToastId, ToastType } from '../../state/toasts'

const toastTypeToMessageType: { [K in ToastType]: MessageProps['type'] } = {
	success: 'success',
	warning: 'warn',
	error: 'danger',
	info: 'info',
}
const toastTypeToIntent: { [K in ToastType]: Intent } = {
	success: 'success',
	warning: 'warn',
	error: 'danger',
	info: 'primary',
}

class ToasterConnected extends PureComponent<Toaster.ToasterStateProps & Toaster.ToasterDispatcherProps> {
	override render() {
		return (
			<div className="toaster">
				{this.props.toasts.map(toast => (
					<div key={toast.id} className="toaster-item">
						<Message
							type={toastTypeToMessageType[toast.type]}
							flow="block"
							lifted
							distinction="striking"
							action={
								<Button
									intent={toastTypeToIntent[toast.type]}
									distinction="seamless"
									flow="squarish"
									onClick={() => {
										this.props.dismissToast(toast.id)
									}}
								>
									<Icon blueprintIcon="cross" style={{ color: 'white' }} />
								</Button>
							}
						>
							{toast.message}
						</Message>
					</div>
				))}
			</div>
		)
	}
}

const Toaster = connect<Toaster.ToasterStateProps, Toaster.ToasterDispatcherProps, {}, State>(
	state => ({ toasts: state.toasts.toasts }),
	(dispatch: Dispatch) => ({ dismissToast: (toastId: ToastId) => dispatch(dismissToast(toastId)) }),
)(ToasterConnected)

namespace Toaster {
	export interface ToasterStateProps extends ToastsState {}
	export interface ToasterDispatcherProps {
		dismissToast: (toastId: ToastId) => void
	}
}

export { Toaster }
