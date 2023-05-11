import { Component } from '@contember/binding'
import type { FieldErrors, RadioProps } from '@contember/ui'
import { FieldContainer, FieldContainerProps, Radio } from '@contember/ui'
import type { FunctionComponent } from 'react'
import { memo, useMemo } from 'react'
import {
	ChoiceField,
	ChoiceFieldData,
	SimpleDynamicSingleChoiceFieldProps,
	StaticSingleChoiceFieldProps,
} from './ChoiceField'
import { useLabelMiddleware } from '../environment/LabelMiddleware'

export type RadioFieldProps =
	& RadioFieldInnerPublicProps
	& (
		| StaticSingleChoiceFieldProps
		| SimpleDynamicSingleChoiceFieldProps
	)

/**
 * @group Form Fields
 */
export const RadioField: FunctionComponent<RadioFieldProps> = Component(props => {
	return (
		<ChoiceField {...props} renderedOptionsLimit={0}>
			{(choiceProps: ChoiceFieldData.SingleChoiceFieldMetadata<any>) => (
				<RadioFieldInner{...props} {...choiceProps} />
			)}
		</ChoiceField>
	)
}, 'RadioField')

export interface RadioFieldInnerPublicProps extends Omit<FieldContainerProps, 'children'>, Pick<RadioProps, 'orientation'> {
}

export interface RadioFieldInnerProps extends ChoiceFieldData.SingleChoiceFieldMetadata, RadioFieldInnerPublicProps {
	errors: FieldErrors | undefined
}


export const RadioFieldInner = memo((props: RadioFieldInnerProps) => {
	const labelMiddleware = useLabelMiddleware()
	const [options, optionsByKey] = useMemo(() => {
		const options = []
		const optionsByKey = new Map()
		for (const option of props.data) {
			const value = option.key.toString()
			options.push({
				value: value,
				label: option.label,
				labelDescription: option.description,
			})
			optionsByKey.set(value, option)
		}
		return [options, optionsByKey]
	}, [props.data])

	return (
		<FieldContainer
			{...props}
			errors={props.errors}
			label={labelMiddleware(props.label)}
			useLabelElement={false}
		>
			<Radio
				onChange={it => props.onSelect(optionsByKey.get(it))}
				options={options}
				size={props.size}
				orientation={props.orientation}
				value={props.currentValue?.key}
			/>
		</FieldContainer>
	)
})
