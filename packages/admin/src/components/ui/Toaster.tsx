import * as React from 'react'
import { connect } from 'react-redux'
import ToastsState, { ToastId, ToastType } from '../../state/toasts'
import State from '../../state'
import { Dispatch } from '../../actions/types'
import { dismissToast } from '../../actions/toasts'
import { Button, Icon, Intent, Message, MessageProps } from '@contember/ui'

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

class ToasterConnected extends React.PureComponent<Toaster.ToasterStateProps & Toaster.ToasterDispatcherProps> {
	render() {
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
