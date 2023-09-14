import { Component, useLabelMiddleware } from '@contember/react-binding'
import type { RadioProps } from '@contember/ui'
import { FieldContainer, FieldContainerProps, Radio } from '@contember/ui'
import type { FunctionComponent } from 'react'
import { memo, useMemo } from 'react'
import { useLabelMiddleware } from '../environment/LabelMiddleware'
import {
	ChoiceField,
	ChoiceFieldData,
	SimpleDynamicSingleChoiceFieldProps,
	StaticSingleChoiceFieldProps,
} from '@contember/react-choice-field'
import { useAccessorErrors } from '@contember/react-binding-ui'

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

export type RadioFieldInnerPublicProps =
	& Omit<FieldContainerProps, 'children' | 'errors' | 'direction'>
	& Pick<RadioProps, 'orientation'>

export type RadioFieldInnerProps =
	& ChoiceFieldData.SingleChoiceFieldMetadata
	& RadioFieldInnerPublicProps

export const RadioFieldInner = memo((props: RadioFieldInnerProps) => {
	const formattedErrors = useAccessorErrors(props.errors)
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
			errors={formattedErrors}
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
