import { Button, ButtonGroup, DropdownRenderProps } from '@contember/ui'
import * as React from 'react'
import { EntityAccessor, EntityCollectionAccessor, FieldAccessor, RelativeSingleField } from '../../../../binding'
import { NormalizedBlockProps } from '../../blocks'

export interface AddNewBlockButtonInnerProps extends DropdownRenderProps {
	addNew: Exclude<EntityCollectionAccessor['addNew'], undefined>
	normalizedBlockProps: NormalizedBlockProps[]
	discriminationField: RelativeSingleField
	isMutating: boolean
}

export const AddNewBlockButtonInner = React.memo<AddNewBlockButtonInnerProps>(props => {
	return (
		<ButtonGroup orientation="vertical">
			{props.normalizedBlockProps.map((blockProps, i) => (
				<Button
					key={i}
					distinction="seamless"
					flow="generousBlock"
					disabled={props.isMutating}
					onClick={() => {
						props.requestClose()
						const targetValue = blockProps.discriminateBy
						//if (filteredEntities.length === 1 && firstDiscriminationNull) {
						//	return firstDiscrimination.updateValue && firstDiscrimination.updateValue(targetValue)
						//}
						props.addNew &&
							props.addNew(getAccessor => {
								const accessor = getAccessor()
								const newlyAdded = accessor.entities[accessor.entities.length - 1]
								if (!(newlyAdded instanceof EntityAccessor)) {
									return
								}
								// TODO this will fail horribly if QL is present here
								const discriminationField = newlyAdded.data.getField(props.discriminationField)
								if (!(discriminationField instanceof FieldAccessor) || !discriminationField.updateValue) {
									return
								}
								discriminationField.updateValue(targetValue)
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
