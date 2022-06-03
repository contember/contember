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
import { useLabelMiddleware } from '../environment/LabelMiddleware'

export type RadioFieldProps =
	& RadioFieldInnerPublicProps
	& (
		| StaticSingleChoiceFieldProps
		| DynamicSingleChoiceFieldProps
	)

export const RadioField: FunctionComponent<RadioFieldProps> = Component(props => {
	return <ChoiceField {...props} >
		{(choiceProps: ChoiceFieldData.SingleChoiceFieldMetadata<any>) => (
			<RadioFieldInner{...props} {...choiceProps} />
		)}
	</ChoiceField>
}, 'RadioField')

export interface RadioFieldInnerPublicProps extends Omit<FieldContainerProps, 'children'>, Pick<RadioProps, 'orientation'> {
}

export interface RadioFieldInnerProps extends ChoiceFieldData.SingleChoiceFieldMetadata, RadioFieldInnerPublicProps {
	errors: FieldErrors | undefined
}


export const RadioFieldInner = memo((props: RadioFieldInnerProps) => {
	const labelMiddleware = useLabelMiddleware()
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
			label={labelMiddleware(props.label)}
			useLabelElement={false}
		>
			<Radio
				onChange={it => props.onSelect(props.data[parseInt(it, 10)])}
				options={options}
				size={props.size}
				orientation={props.orientation}
				value={props.currentValue?.key}
			/>
		</FieldContainer>
	)
})
