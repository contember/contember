import { Component, Field, FieldAccessor } from '@contember/binding'
import * as React from 'react'
import { Checkbox } from '../../ui'
import {
	SimpleRelativeSingleFieldMetadata,
	SimpleRelativeSingleFieldProps,
	SimpleRelativeSingleFieldProxy,
} from '../auxiliary'
import { BlockProps } from '../blocks'

export type CheckboxFieldProps = SimpleRelativeSingleFieldProps

export const CheckboxField: React.FunctionComponent<CheckboxFieldProps> = Component(
	props => (
		<SimpleRelativeSingleFieldProxy
			{...props}
			render={(fieldMetadata: SimpleRelativeSingleFieldMetadata<boolean>, props) => {
				const generateOnChange = (data: FieldAccessor<boolean>) => (isChecked: boolean) => {
					data.updateValue(isChecked)
				}
				return (
					<Checkbox
						checked={!!fieldMetadata.field.value}
						onChange={generateOnChange(fieldMetadata.field)}
						readOnly={fieldMetadata.isMutating}
						errors={fieldMetadata.field.errors}
					>
						{fieldMetadata.environment.applySystemMiddleware('labelMiddleware', props.label)}
					</Checkbox>
				)
			}}
		/>
	),
	props => {
		let isNonbearing = props.isNonbearing
		let defaultValue = props.defaultValue

		if (props.defaultValue === undefined && props.isNonbearing !== false) {
			defaultValue = false
			isNonbearing = true
		}

		return (
			<>
				<Field defaultValue={defaultValue} field={props.field} isNonbearing={isNonbearing} />
				{props.label}
				{props.labelDescription}
				{props.description}
			</>
		)
	},
	'CheckboxField',
)
