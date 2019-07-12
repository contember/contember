import { Icon } from '@blueprintjs/core'
import { IconName, IconNames } from '@blueprintjs/icons'
import * as React from 'react'
import { Button, ButtonProps } from '../../../components'
import { MutationStateContext } from '../../coreComponents/PersistState'
import { EntityCollectionAccessor } from '../../dao'

export interface AddNewButtonProps extends React.PropsWithChildren<ButtonProps> {
	addNew: EntityCollectionAccessor['addNew']
	icon?: IconName
}

export const AddNewButton = React.memo((props: AddNewButtonProps) => {
	const isMutating = React.useContext(MutationStateContext)
	const { addNew, icon, ...rest } = props
	const addNewCallback = React.useCallback(() => addNew && addNew(), [addNew])
	if (addNew) {
		return (
			<Button onClick={addNewCallback} disabled={isMutating} small {...rest}>
				<Icon icon={icon || IconNames.ADD} />
				{props.children || 'Add'}
			</Button>
		)
	}
	return null
})
