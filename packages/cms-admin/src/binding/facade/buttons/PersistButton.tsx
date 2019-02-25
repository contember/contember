import * as React from 'react'
import { connect } from 'react-redux'
import { addToast } from '../../../actions/toasts'
import { Dispatch } from '../../../actions/types'
import { Button, Intent } from '../../../components'
import State from '../../../state'
import { ToastDefinition, ToastType } from '../../../state/toasts'
import { MetaOperationsContext, MetaOperationsContextValue } from '../../coreComponents'

export interface PersistButtonOwnProps {
	successMessage?: string
	failureMessage?: string
}

export interface PersistButtonDispatchProps {
	showToast: (toast: ToastDefinition) => void
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
								intent={Intent.Success}
								// icon="floppy-disk"
								onClick={this.getOnPersist(value.triggerPersist)}
								// intent={Intent.PRIMARY}
								// loading={this.state.isLoading}
								// large={true}
							>
								{this.props.children || 'Save'}
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
		showToast: (toast: ToastDefinition) => {
			dispatch(addToast(toast))
		}
	})
)(PersistButtonConnected)
