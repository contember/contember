import * as React from 'react'
import { Button, Intent } from '../../../components'
import { MetaOperationsContext, MetaOperationsContextValue } from '../../coreComponents'

export interface PersistButtonProps {}

interface PersistButtonState {
	isLoading: boolean
}

export class PersistButton extends React.PureComponent<PersistButtonProps, PersistButtonState> {
	public readonly state: PersistButtonState = {
		isLoading: false
	}

	private getOnPersist = (triggerPersist: () => Promise<void>) => () => {
		if (this.state.isLoading) {
			return
		}

		triggerPersist().finally(() => this.setState({ isLoading: false }))
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
