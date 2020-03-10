import { EntityAccessor, SugaredRelativeSingleField, useDesugaredRelativeSingleField } from '@contember/binding'
import { Button, ButtonGroup, DropdownRenderProps } from '@contember/ui'
import * as React from 'react'
import { NormalizedBlock } from '../../blocks'
import { AddNewEntityButtonProps } from '../helpers'

export interface AddNewBlockButtonInnerProps extends DropdownRenderProps, AddNewEntityButtonProps {
	normalizedBlocks: NormalizedBlock[]
	discriminationField: string | SugaredRelativeSingleField
	isMutating: boolean
}

export const AddNewBlockButtonInner = React.memo<AddNewBlockButtonInnerProps>(props => {
	const desugaredDiscriminationField = useDesugaredRelativeSingleField(props.discriminationField)
	return (
		<ButtonGroup orientation="vertical">
			{props.normalizedBlocks.map((blockProps, i) => (
				<Button
					key={i}
					distinction="seamless"
					flow="generousBlock"
					disabled={props.isMutating}
					onClick={() => {
						props.requestClose()
						const targetValue = blockProps.discriminateBy

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
