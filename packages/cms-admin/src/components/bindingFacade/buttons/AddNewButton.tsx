import { Icon } from '@blueprintjs/core'
import { IconName, IconNames } from '@blueprintjs/icons'
import { Button, ButtonProps } from '@contember/ui'
import * as React from 'react'
import { useMutationState } from '../../../binding/accessorTree'
import { EntityCollectionAccessor } from '../../../binding/dao'

export type AddNewButtonProps = ButtonProps & {
	addNew: EntityCollectionAccessor['addNew']
	icon?: IconName
}

export const AddNewButton = React.memo((props: AddNewButtonProps) => {
	const isMutating = useMutationState()
	const { addNew, icon, ...rest } = props
	const addNewCallback = React.useCallback(() => addNew && addNew(), [addNew])
	if (addNew) {
		return (
			<Button onClick={addNewCallback} disabled={isMutating} distinction="seamless" flow="default" {...rest}>
				<Icon
					icon={icon || IconNames.ADD}
					style={{
						marginRight: '0.2em',
						position: 'relative',
						top: '0.05em',
					}}
				/>
				{props.children || 'Add'}
			</Button>
		)
	}
	return null
})
