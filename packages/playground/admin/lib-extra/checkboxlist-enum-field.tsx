import { Component, Field, OptionallyVariableFieldValue, SugaredRelativeSingleField, useField } from '@contember/interface'
import { FormFieldScope, useFormFieldState } from '@contember/react-form'
import { ReactNode, useMemo } from 'react'
import { FormContainer, FormContainerProps, FormLabelUI } from '~/lib/form'
import { useEnumOptionsFormatter } from '~/lib/labels'
import { CheckboxInput } from '~/lib/ui/input'

export type CheckboxListEnumFieldProps =
	& Omit<FormContainerProps, 'children'>
	& {
		field: SugaredRelativeSingleField['field']
		isNonbearing?: boolean
		defaultValue?: OptionallyVariableFieldValue
		options?: Record<string, ReactNode> | Array<{ value: string | number | boolean; label: React.ReactNode }>
		orientation?: 'horizontal' | 'vertical'
		inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'defaultValue'>
	}

export const CheckboxListEnumField = Component<CheckboxListEnumFieldProps>(({ field, label, description, required, ...rest }) => {
	return (
		<FormFieldScope field={field}>
			<FormContainer description={description} label={label} required={required}>
				<CheckboxListEnumFieldInner field={field} required={required} {...rest} />
			</FormContainer>
		</FormFieldScope>
	)
}, ({ field, isNonbearing, defaultValue }) => <Field field={field} isNonbearing={isNonbearing} defaultValue={defaultValue} />)

type CheckboxListEnumFieldInnerProps = Pick<CheckboxListEnumFieldProps, 'field' | 'options' | 'orientation' | 'inputProps' | 'defaultValue' | 'isNonbearing' | 'required'>

const CheckboxListEnumFieldInner: React.FC<CheckboxListEnumFieldInnerProps> = ({ field, inputProps, options, orientation }) => {
	const enumLabelsFormatter = useEnumOptionsFormatter()
	const enumName = useFormFieldState()?.field?.enumName
	const fieldAccessor = useField<(string | number | boolean)[]>(field)
	options ??= enumName ? enumLabelsFormatter(enumName) : undefined
	if (!options) {
		throw new Error('CheckboxListEnumField: options are required')
	}

	const normalizedOptions = useMemo(() => {
		return Array.isArray(options) ? options : Object.entries(options).map(([value, label]) => ({ value, label }))
	}, [options])

	return (
		<div className={'flex flex-wrap gap-3 data-[orientation=vertical]:flex-col'} data-orientation={orientation ?? 'vertical'}>
			{normalizedOptions.map(({ value, label }) => (
				<FormLabelUI className="flex gap-2 items-center font-normal" key={value?.toString()}>
					<CheckboxInput
						{...inputProps}
						checked={fieldAccessor.value?.includes(value)}
						onChange={e => {
							if (e.target.checked) {
								fieldAccessor.updateValue([...(fieldAccessor.value ?? []), value])
							} else {
								fieldAccessor.updateValue(fieldAccessor.value?.filter(it => it !== value) ?? [])
							}
						}}
					/>
					{label}
				</FormLabelUI>
			))}
		</div>
	)
}
