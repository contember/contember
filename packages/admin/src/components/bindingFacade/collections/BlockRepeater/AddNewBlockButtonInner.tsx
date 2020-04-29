import { EntityAccessor, SugaredRelativeSingleField, useDesugaredRelativeSingleField } from '@contember/binding'
import { Button, ButtonGroup, DropdownRenderProps } from '@contember/ui'
import * as React from 'react'
import { NormalizedBlocks } from '../../blocks'
import { AddNewEntityButtonProps } from '../helpers'

export interface AddNewBlockButtonInnerProps extends DropdownRenderProps, AddNewEntityButtonProps {
	normalizedBlocks: NormalizedBlocks
	discriminationField: string | SugaredRelativeSingleField
	isMutating: boolean
}

export const AddNewBlockButtonInner = React.memo<AddNewBlockButtonInnerProps>(props => {
	const desugaredDiscriminationField = useDesugaredRelativeSingleField(props.discriminationField)
	return (
		<ButtonGroup orientation="vertical">
			{Array.from(props.normalizedBlocks.data.values()).map(({ discriminateBy, data: blockProps }, i) => (
				<Button
					key={i}
					distinction="seamless"
					flow="generousBlock"
					disabled={props.isMutating}
					onClick={() => {
						props.requestClose()
						const targetValue = discriminateBy

						props.addNew?.((getAccessor, newKey) => {
							const accessor = getAccessor()
							const newlyAdded = accessor.getByKey(newKey) as EntityAccessor
							const discriminationField = newlyAdded.getRelativeSingleField(desugaredDiscriminationField)
							discriminationField.updateValue?.(targetValue)
						})
					}}
				>
					{!!blockProps.description && (
						<span>
							{blockProps.label}
							<br />
							<small>{blockProps.description}</small>
						</span>
					)}
					{!blockProps.description && blockProps.label}
				</Button>
			))}
		</ButtonGroup>
	)
})
AddNewBlockButtonInner.displayName = 'AddNewBlockButtonInner'
