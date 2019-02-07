import { Intent } from '@blueprintjs/core'
import * as React from 'react'
import { MetaOperationsContext, MetaOperationsContextValue } from '../../coreComponents'
import { FeedbackToaster } from '../renderers/userFeedback'
import { Button, ButtonColor } from '../../../components'

export interface PersistButtonProps {
	successMessage?: string
	failureMessage?: string
}

interface PersistButtonState {
	isLoading: boolean
}

export class PersistButton extends React.Component<PersistButtonProps, PersistButtonState> {
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
				toaster.show({
					intent: Intent.SUCCESS,
					message: this.props.successMessage || 'Success!'
				})
			)
			.catch(() =>
				toaster.show({
					intent: Intent.DANGER,
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
