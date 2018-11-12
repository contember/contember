import { Button, IButtonProps, Intent, IProps } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import * as React from 'react'
import { EntityCollectionAccessor } from '../../dao'

interface AddNewButtonProps extends Pick<IButtonProps, 'icon' | 'intent' | 'large' | 'small'>, IProps {
	addNew: EntityCollectionAccessor['addNew']
}

export class AddNewButton extends React.PureComponent<AddNewButtonProps> {
	public render() {
		return (
			this.props.addNew && (
				<Button
					icon={this.props.icon || IconNames.ADD}
					onClick={this.props.addNew}
					intent={this.props.intent || Intent.NONE}
					large={this.props.large !== undefined ? this.props.large : false}
					small={this.props.small !== undefined ? this.props.small : false}
					className={this.props.className}
				>
					{this.props.children}
				</Button>
			)
		)
	}
}
