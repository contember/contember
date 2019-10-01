import * as React from 'react'
import { connect } from 'react-redux'
import ToastsState, { ToastId, ToastType } from '../../state/toasts'
import State from '../../state'
import { Icon } from '@blueprintjs/core'
import { Dispatch } from '../../actions/types'
import { dismissToast } from '../../actions/toasts'
import { Button, Intent, ValidationMessage, ValidationMessageProps } from '@contember/ui'

const toastTypeToMessageType: { [K in ToastType]: ValidationMessageProps['type'] } = {
	[ToastType.Success]: 'valid',
	[ToastType.Warning]: 'warning',
	[ToastType.Error]: 'invalid',
	[ToastType.Info]: 'info',
}
const toastTypeToIntent: { [K in ToastType]: Intent } = {
	[ToastType.Success]: 'success',
	[ToastType.Warning]: 'warn',
	[ToastType.Error]: 'danger',
	[ToastType.Info]: 'primary',
}

class ToasterConnected extends React.PureComponent<Toaster.ToasterStateProps & Toaster.ToasterDispatcherProps> {
	render() {
		return (
			<div className="toaster">
				{this.props.toasts.map(toast => (
					<div key={toast.id} className="toaster-item">
						<ValidationMessage
							type={toastTypeToMessageType[toast.type]}
							flow="block"
							framed
							lifted
							action={
								<Button
									intent={toastTypeToIntent[toast.type]}
									distinction="seamless"
									flow="squarish"
									onClick={() => {
										this.props.dismissToast(toast.id)
									}}
									bland
								>
									<Icon icon="cross" color="currentColor" />
								</Button>
							}
						>
							{toast.message}
						</ValidationMessage>
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
