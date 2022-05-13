import { Component } from '@contember/binding'
import type { FieldErrors, RadioProps } from '@contember/ui'
import { FieldContainer, FieldContainerProps, Radio, RadioOption } from '@contember/ui'
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

export interface RadioFieldInnerPublicProps extends Omit<FieldContainerProps, 'children'>, Pick<RadioProps, 'orientation'> {
}

export interface RadioFieldInnerProps extends ChoiceFieldData.SingleChoiceFieldMetadata, RadioFieldInnerPublicProps {
	errors: FieldErrors | undefined
}


export const RadioFieldInner = memo((props: RadioFieldInnerProps) => {
	const options: RadioOption[] = props.data.map(({ key, label, description }) => {
		return {
			value: key.toString(),
			label: label,
			labelDescription: description,
		}
	})

	return (
		<FieldContainer
			{...props}
			errors={props.errors}
			label={props.environment.applyLabelMiddleware(props.label)}
			useLabelElement={false}
		>
			<Radio
				onChange={it => props.onChange(parseInt(it, 10))}
				options={options}
				size={props.size}
				orientation={props.orientation}
				value={props.currentValue?.toString()}
			/>
		</FieldContainer>
	)
})
