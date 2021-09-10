import { Component, ErrorAccessor } from '@contember/binding'
import type { RadioGroupProps } from '@contember/ui'
import { FormGroup, FormGroupProps, RadioGroup, RadioOption } from '@contember/ui'
import type { FunctionComponent } from 'react'
import { memo } from 'react'
import {
	ChoiceField,
	ChoiceFieldData,
	DynamicSingleChoiceFieldProps,
	StaticSingleChoiceFieldProps,
} from './ChoiceField'

export type RadioFieldProps =
	& RadioFieldInnerPublicProps
	& (
		| StaticSingleChoiceFieldProps
		| DynamicSingleChoiceFieldProps
	)

export const RadioField: FunctionComponent<RadioFieldProps> = Component(props => {
	return <ChoiceField {...props} >
		{({
				data,
				currentValue,
				onChange,
				errors,
				environment,
				isMutating,
			}: ChoiceFieldData.SingleChoiceFieldMetadata) => (
			<RadioFieldInner
				{...props}
				data={data}
				currentValue={currentValue}
				onChange={onChange}
				environment={environment}
				errors={errors}
				isMutating={isMutating}
			/>
		)}
	</ChoiceField>
}, 'RadioField')

export interface RadioFieldInnerPublicProps extends Omit<FormGroupProps, 'children'>, Pick<RadioGroupProps, 'orientation'> {
}

export interface RadioFieldInnerProps extends ChoiceFieldData.SingleChoiceFieldMetadata, RadioFieldInnerPublicProps {
	errors: ErrorAccessor | undefined
}


export const RadioFieldInner = memo((props: RadioFieldInnerProps) => {
	const options: RadioOption[] = props.data.map(({ key, label, description }) => {
			return {
				disabled: false,
				value: key.toString(),
				label: label,
				labelDescription: description,
			}
		})
	return (
		<FormGroup {...props} label={props.environment.applySystemMiddleware('labelMiddleware', props.label)}>
			<RadioGroup
				onChange={it => props.onChange(parseInt(it, 10))}
				options={options}
				size={props.size}
				orientation={props.orientation}
				errors={props.errors?.validation}
				value={props.currentValue?.toString()}
			/>
		</FormGroup>
	)
})
