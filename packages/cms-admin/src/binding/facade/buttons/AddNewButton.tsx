import { Icon } from '@blueprintjs/core'
import { IconName, IconNames } from '@blueprintjs/icons'
import * as React from 'react'
import { Button, ButtonProps } from '../../../components'
import { EntityCollectionAccessor } from '../../dao'

export interface AddNewButtonProps extends ButtonProps {
	addNew: EntityCollectionAccessor['addNew']
	icon?: IconName
}

export class AddNewButton extends React.PureComponent<AddNewButtonProps> {
	public render() {
		const { addNew, icon, ...rest } = this.props
		return (
			addNew && (
				<Button onClick={addNew} small {...rest}>
					<Icon icon={icon || IconNames.ADD} />
				</Button>
			)
		)
	}
}
