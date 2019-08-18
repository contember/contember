import * as React from 'react'
import { Checkbox } from '../../../components'
import { FieldAccessor } from '../../dao'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'

export type CheckboxFieldProps = SimpleRelativeSingleFieldProps

export const CheckboxField = SimpleRelativeSingleField<CheckboxFieldProps, boolean>((fieldMetadata, props) => {
	const generateOnChange = (data: FieldAccessor<boolean>) => (isChecked: boolean) => {
		data.updateValue && data.updateValue(isChecked)
	}
	return (
		<Checkbox
			checked={!!fieldMetadata.data.currentValue}
			onChange={generateOnChange(fieldMetadata.data)}
			readOnly={fieldMetadata.isMutating}
			errors={fieldMetadata.errors}
		>
			{fieldMetadata.environment.applySystemMiddleware('labelMiddleware', props.label)}
		</Checkbox>
	)
}, 'CheckboxField')
