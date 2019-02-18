import { Intent } from '@blueprintjs/core'
import * as React from 'react'
import { MetaOperationsContext, MetaOperationsContextValue } from '../../coreComponents'
import { FeedbackToaster } from '../renderers/userFeedback'
import { Button, ButtonColor } from '../../../components'
import { connect } from 'react-redux'
import State from '../../../state'
import { Dispatch } from '../../../actions/types'
import { Toast, ToastType } from '../../../state/toasts'
import { addToast } from '../../../actions/toasts'

export interface PersistButtonOwnProps {
	successMessage?: string
	failureMessage?: string
}

export interface PersistButtonDispatchProps {
	showToast: (toast: Toast) => void
}

interface PersistButtonState {
	isLoading: boolean
}

class PersistButtonConnected extends React.Component<
	PersistButtonOwnProps & PersistButtonDispatchProps,
	PersistButtonState
> {
	public readonly state: PersistButtonState = {
		isLoading: false
	}

	private getOnPersist = (triggerPersist: () => Promise<void>) => () => {
		if (this.state.isLoading) {
			return
		}
		const toaster = FeedbackToaster.toaster
		triggerPersist()
			.then(() =>
				this.props.showToast({
					type: ToastType.Success,
					message: this.props.successMessage || 'Success!'
				})
			)
			.catch(() =>
				this.props.showToast({
					type: ToastType.Error,
					message: this.props.failureMessage || 'Failure!'
				})
			)
			.finally(() => this.setState({ isLoading: false }))
		this.setState({
			isLoading: true
		})
	}

	public render() {
		return (
			<MetaOperationsContext.Consumer>
				{(value: MetaOperationsContextValue) => {
					if (value) {
						return (
							<Button
								color={ButtonColor.Green}
								// icon="floppy-disk"
								onClick={this.getOnPersist(value.triggerPersist)}
								// intent={Intent.PRIMARY}
								// loading={this.state.isLoading}
								// large={true}
							>
								{this.props.children || 'Save!'}
							</Button>
						)
					}
				}}
			</MetaOperationsContext.Consumer>
		)
	}
}

export const PersistButton = connect<{}, PersistButtonDispatchProps, PersistButtonOwnProps, State>(
	null,
	(dispatch: Dispatch) => ({
		showToast: (toast: Toast) => {
			dispatch(addToast(toast))
		}
	})
)(PersistButtonConnected)
