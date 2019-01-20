import { Button, IButtonProps, Intent, IProps } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import * as React from 'react'
import { DataContext, DataContextValue } from '../../coreComponents'
import { EntityAccessor } from '../../dao'

export interface RemoveButtonProps
	extends Pick<IButtonProps, 'icon' | 'intent' | 'large' | 'small' | 'minimal'>,
		IProps {
	removeType?: RemoveButton.RemovalType
}

class RemoveButton extends React.Component<RemoveButtonProps> {
	public render() {
		return (
			<DataContext.Consumer>
				{(value: DataContextValue) => {
					if (value instanceof EntityAccessor) {
						return (
							<Button
								icon={this.props.icon || IconNames.DELETE}
								onClick={() => value.remove && value.remove(this.mapToRemovalType(this.props.removeType))}
								intent={this.props.intent || Intent.DANGER}
								small={this.props.small !== undefined ? this.props.small : true}
								large={this.props.large !== undefined ? this.props.large : false}
								minimal={this.props.minimal !== undefined ? this.props.minimal : true}
								className={this.props.className}
							/>
						)
					}
				}}
			</DataContext.Consumer>
		)
	}

	private mapToRemovalType(removalType?: RemoveButton.RemovalType): EntityAccessor.RemovalType {
		switch (removalType) {
			case 'disconnect':
				return EntityAccessor.RemovalType.Disconnect
			case 'delete':
				return EntityAccessor.RemovalType.Delete
			default:
				// By default, we just unlink unless explicitly told to actually delete
				return EntityAccessor.RemovalType.Disconnect
		}
	}
}

namespace RemoveButton {
	// This enum is technically useless but it allows users to avoid importing EntityAccessor.RemovalType
	export type RemovalType = 'disconnect' | 'delete'
}

export { RemoveButton }
