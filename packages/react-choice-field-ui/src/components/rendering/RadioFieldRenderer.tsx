import { EntityAccessor, FieldValue, useLabelMiddleware } from '@contember/react-binding'
import type { RadioProps } from '@contember/ui'
import { FieldContainer, FieldContainerProps, Radio } from '@contember/ui'
import { memo, ReactNode, useMemo } from 'react'
import { ChoiceFieldSingleOption, SingleChoiceFieldRendererProps } from '@contember/react-choice-field'
import { useAccessorErrors } from '@contember/react-binding-ui'


export type RadioFieldRendererPublicProps =
	& Omit<FieldContainerProps, 'children' | 'errors'>
	& Pick<RadioProps, 'orientation'>

export type RadioFieldRendererProps<T = unknown> =
	& SingleChoiceFieldRendererProps<T>
	& RadioFieldRendererPublicProps

export const RadioFieldRenderer = memo(<T = unknown>(props: RadioFieldRendererProps<T>) => {
	const formattedErrors = useAccessorErrors(props.errors)
	const labelMiddleware = useLabelMiddleware()
	const [options, optionsByKey] = useMemo(() => {
		const options: { value: string, label: ReactNode, labelDescription?: ReactNode }[] = []
		const optionsByKey = new Map<string, ChoiceFieldSingleOption<T>>()
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
				onChange={it => props.onSelect(optionsByKey.get(it)?.value as T)}
				options={options}
				size={props.size}
				orientation={props.orientation}
				value={props.currentValue?.key}
			/>
		</FieldContainer>
	)
})
