import { SugaredRelativeSingleField, useDesugaredRelativeSingleField } from '@contember/binding'
import { Button, ButtonGroup, DropdownRenderProps } from '@contember/ui'
import { memo } from 'react'
import type { NormalizedBlocks } from '../../blocks'
import type { CreateNewEntityButtonProps } from '../helpers'

export interface AddNewBlockButtonInnerProps extends DropdownRenderProps, CreateNewEntityButtonProps {
	normalizedBlocks: NormalizedBlocks
	discriminationField: string | SugaredRelativeSingleField
	isMutating: boolean
}

/**
 * @internal
 */
export const AddNewBlockButtonInner = memo<AddNewBlockButtonInnerProps>(props => {
	const desugaredDiscriminationField = useDesugaredRelativeSingleField(props.discriminationField)
	return (
		<ButtonGroup direction="vertical">
			{Array.from(props.normalizedBlocks.values(), ({ discriminateBy, datum: blockProps }, i) => (
				<Button
					key={i}
					disabled={props.isMutating}
					display="block"
					distinction="seamless"
					onClick={() => {
						props.requestClose()
						const targetValue = discriminateBy

						props.createNewEntity(getNewlyAdded => {
							const discriminationField = getNewlyAdded().getRelativeSingleField(desugaredDiscriminationField)
							discriminationField.updateValue(targetValue)
						})
					}}
					padding="padding"
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
