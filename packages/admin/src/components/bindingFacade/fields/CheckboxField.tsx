import * as React from 'react'
import { FieldAccessor } from '@contember/binding'
import { Checkbox } from '../../ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'

export type CheckboxFieldProps = SimpleRelativeSingleFieldProps

export const CheckboxField = SimpleRelativeSingleField<CheckboxFieldProps, boolean>((fieldMetadata, props) => {
	const generateOnChange = (data: FieldAccessor<boolean>) => (isChecked: boolean) => {
		data.updateValue && data.updateValue(isChecked)
	}
	return (
		<Checkbox
			checked={!!fieldMetadata.field.currentValue}
			onChange={generateOnChange(fieldMetadata.field)}
			readOnly={fieldMetadata.isMutating}
			errors={fieldMetadata.field.errors}
		>
			{fieldMetadata.environment.applySystemMiddleware('labelMiddleware', props.label)}
		</Checkbox>
	)
}, 'CheckboxField')
