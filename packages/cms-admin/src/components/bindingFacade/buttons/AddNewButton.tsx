import { Button, ButtonProps, Icon, IconProps, FormGroup } from '@contember/ui'
import * as React from 'react'
import { EntityCollectionAccessor, useMutationState } from '../../../binding'

export type AddNewButtonProps = ButtonProps & {
	addNew: EntityCollectionAccessor['addNew']
	icon?: IconProps['blueprintIcon']
}

export const AddNewButton = React.memo((props: AddNewButtonProps) => {
	const isMutating = useMutationState()
	const { addNew, icon, ...rest } = props
	const addNewCallback = React.useCallback(() => addNew && addNew(), [addNew])
	if (addNew) {
		return (
			<FormGroup label={undefined}>
				<Button onClick={addNewCallback} disabled={isMutating} distinction="seamless" flow="block" {...rest}>
					<Icon
						blueprintIcon={icon || 'add'}
						style={{
							marginRight: '0.2em',
							position: 'relative',
							top: '0.05em',
						}}
					/>
					{props.children || 'Add'}
				</Button>
			</FormGroup>
		)
	}
	return null
})
