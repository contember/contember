import { Component, Field, FieldProps } from '../coreComponents'
import { SugaredRelativeSingleField } from '../treeParameters'

export interface SugaredFieldProps extends Omit<FieldProps, 'field'> {
	field: string | SugaredRelativeSingleField
}

export const SugaredField = Component<SugaredFieldProps>(props => {
	if (typeof props.field === 'string') {
		return <Field {...props} field={props.field} />
	}
	return <Field {...props} {...props.field} />
}, 'SugaredField')
