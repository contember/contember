import * as React from 'react'
import { AccessorTreeRoot, DataBindingError, EntityAccessor, FieldAccessor, FieldName } from '../../../../binding'
import { ChoiceFieldData } from './ChoiceFieldData'
import { DynamicChoiceFieldImplementation } from './DynamicChoiceFieldImplementation'

export type DynamicChoiceFieldProps = ChoiceFieldData.InnerBaseProps & {
	options: FieldName
}

export const DynamicChoiceField = React.memo<DynamicChoiceFieldProps>(({ data, ...props }) => {
	if (!(data instanceof EntityAccessor)) {
		throw new DataBindingError('Corrupted data')
	}

	const subTreeRootAccessor = data.data.getTreeRoot(props.fieldName)
	const currentValueEntity = data.data.getField(props.fieldName)

	if (!(subTreeRootAccessor instanceof AccessorTreeRoot)) {
		throw new DataBindingError('Corrupted data: dynamic choice field options have not been retrieved.')
	}
	if (
		currentValueEntity === undefined ||
		currentValueEntity instanceof FieldAccessor ||
		currentValueEntity instanceof AccessorTreeRoot
	) {
		throw new DataBindingError('Corrupted data: dynamic choice field must be a reference, not a field or a sub-tree.')
	}

	return (
		<DynamicChoiceFieldImplementation
			currentValueEntity={currentValueEntity}
			subTreeRootAccessor={subTreeRootAccessor}
			{...props}
		/>
	)
})
DynamicChoiceField.displayName = 'DynamicChoiceField'
