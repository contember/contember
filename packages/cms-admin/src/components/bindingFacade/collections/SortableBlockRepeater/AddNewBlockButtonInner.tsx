import { Button, ButtonGroup, DropdownRenderProps } from '@contember/ui'
import * as React from 'react'
import {
	EntityAccessor,
	EntityListAccessor,
	FieldAccessor,
	getRelativeSingleField,
	SugaredRelativeSingleField,
	useDesugaredRelativeSingleField,
} from '../../../../binding'
import { NormalizedBlockProps } from '../../blocks'

export interface AddNewBlockButtonInnerProps extends DropdownRenderProps {
	addNew: Exclude<EntityListAccessor['addNew'], undefined>
	normalizedBlockProps: NormalizedBlockProps[]
	discriminationField: SugaredRelativeSingleField
	isMutating: boolean
}

export const AddNewBlockButtonInner = React.memo<AddNewBlockButtonInnerProps>(props => {
	const desugaredDiscriminationField = useDesugaredRelativeSingleField(props.discriminationField)
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
								const discriminationField = getRelativeSingleField(newlyAdded, desugaredDiscriminationField)
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
