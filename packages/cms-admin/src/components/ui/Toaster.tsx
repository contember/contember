import * as React from 'react'
import { connect } from 'react-redux'
import cn from 'classnames'
import { Toast, ToastType } from '../../state/toasts'
import State from '../../state'
import { Icon } from '@blueprintjs/core'
import { Dispatch } from '../../actions/types'
import { dismissToast } from '../../actions/toasts'

const typeClassName: { [K in ToastType]: string } = {
	[ToastType.Success]: 'view-success',
	[ToastType.Warning]: 'view-warning',
	[ToastType.Error]: 'view-error',
	[ToastType.Info]: 'view-info'
}

class ToasterConnected extends React.PureComponent<Toaster.ToasterStateProps & Toaster.ToasterDispatcherProps> {
	render() {
		return (
			<div className="toast-wrap">
				{this.props.toasts.map(toast => (
					<div key={toast.type + toast.message} className={cn('toast', typeClassName[toast.type])}>
						<p className="toast-message">{toast.message}</p>
						<button
							className="toast-button"
							onClick={e => {
								e.preventDefault()
								this.props.dismissToast(toast)
							}}
						>
							<Icon icon="cross" color="currentColor" />
						</button>
					</div>
				))}
			</div>
		)
	}
}

const Toaster = connect<Toaster.ToasterStateProps, Toaster.ToasterDispatcherProps, {}, State>(
	state => ({ toasts: state.toasts.toasts }),
	(dispatch: Dispatch) => ({ dismissToast: (toast: Toast) => dispatch(dismissToast(toast)) })
)(ToasterConnected)

namespace Toaster {
	export interface ToasterStateProps {
		toasts: Toast[]
	}
	export interface ToasterDispatcherProps {
		dismissToast: (toast: Toast) => void
	}
}

export { Toaster }
