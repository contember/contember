import { Component, Field, FieldBasicProps } from '@contember/react-binding'
import { ReactNode } from 'react'

export type HiddenFieldProps =
	& FieldBasicProps
	& {
		/**
		 * @deprecated label makes no sense for hidden field
		 */
		label?: ReactNode
	}

/**
 * The `HiddenField` components is used to include data into the form but hide them from user.
 *
 * @group Form Fields
 */
export const HiddenField = Component<HiddenFieldProps>(
	() => null,
	props => (
		<Field
			defaultValue={props.defaultValue}
			field={props.field}
			isNonbearing={props.isNonbearing ?? true}
		/>
	),
	'HiddenField',
)
