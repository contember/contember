import { Field, FieldAccessor, SugaredRelativeSingleField, useDrivenField } from '@contember/binding'
import { Component } from '@contember/binding/dist/src/coreComponents/Component'
import { TextInput, TextInputProps } from '@contember/ui'
import * as React from 'react'
import { SimpleRelativeSingleFieldProps } from '../auxiliary'
import { SimpleRelativeSingleFieldProxy } from '../auxiliary/SimpleRelativeSingleField/SimpleRelativeFieldProxy'

export type DrivenTextFieldProps = SimpleRelativeSingleFieldProps &
	Omit<TextInputProps, 'value' | 'onChange' | 'validationState'> & {
		drivenBy: SugaredRelativeSingleField['field']
	}

export const DrivenTextField = Component<DrivenTextFieldProps>(
	props => {
		return (
			<SimpleRelativeSingleFieldProxy
				{...props}
				render={(fieldMetadata, { drivenBy, defaultValue, label, ...otherProps }) => {
					useDrivenField<string>(drivenBy, props.field)
					const generateOnChange = (data: FieldAccessor<string>): TextInputProps['onChange'] => e => {
						data.updateValue?.(!e.target.value && data.persistedValue === null ? null : e.target.value)
					}
					return (
						<TextInput
							value={fieldMetadata.field.currentValue || ''}
							onChange={generateOnChange(fieldMetadata.field)}
							validationState={fieldMetadata.field.errors.length ? 'invalid' : undefined}
							readOnly={fieldMetadata.isMutating}
							{...(otherProps as any)} // This is VERY wrong.
						/>
					)
				}}
			/>
		)
	},
	props => {
		return (
			<>
				<Field defaultValue={props.defaultValue} field={props.field} isNonbearing={props.isNonbearing} />
				<Field field={props.drivenBy} />
				{props.label}
				{props.labelDescription}
				{props.description}
			</>
		)
	},
	'DrivenTextField',
)
