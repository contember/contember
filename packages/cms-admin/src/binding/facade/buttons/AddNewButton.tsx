import { Icon } from '@blueprintjs/core'
import { IconName, IconNames } from '@blueprintjs/icons'
import * as React from 'react'
import { Button, ButtonProps } from '../../../components'
import { EntityCollectionAccessor } from '../../dao'

export interface AddNewButtonProps extends React.PropsWithChildren<ButtonProps> {
	addNew: EntityCollectionAccessor['addNew']
	icon?: IconName
}

export const AddNewButton = React.memo((props: AddNewButtonProps) => {
	const { addNew, icon, ...rest } = props
	if (addNew) {
		return (
			<Button onClick={addNew} small {...rest}>
				<Icon icon={icon || IconNames.ADD} />
				{props.children || 'Add'}
			</Button>
		)
	}
	return null
})
