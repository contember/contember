import { Button, IButtonProps, Intent, IProps } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import * as React from 'react'
import { DataContext, DataContextValue } from '../../coreComponents'
import { EntityAccessor } from '../../dao'

export interface UnlinkButtonProps
	extends Pick<IButtonProps, 'icon' | 'intent' | 'large' | 'small' | 'minimal'>,
		IProps {}

export class UnlinkButton extends React.Component<UnlinkButtonProps> {
	public render() {
		return (
			<DataContext.Consumer>
				{(value: DataContextValue) => {
					if (value instanceof EntityAccessor) {
						return (
							<Button
								icon={this.props.icon || IconNames.DELETE}
								onClick={value.unlink}
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
}
