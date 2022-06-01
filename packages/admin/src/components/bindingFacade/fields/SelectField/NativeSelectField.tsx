import { BindingError, Component, useMutationState } from '@contember/binding'
import {
	FieldContainer,
	FieldContainerProps,
	FieldErrors,
	flipValue,
	Select,
	SelectCreateNewWrapper,
	SelectOption,
} from '@contember/ui'
import { forwardRef, FunctionComponent, memo, RefAttributes } from 'react'
import {
	ChoiceField,
	ChoiceFieldData,
	DynamicSingleChoiceFieldProps,
	StaticSingleChoiceFieldProps,
} from '../ChoiceField'
import { useLabelMiddleware } from '../../environment/LabelMiddleware'

export type NativeSelectFieldProps =
	& NativeSelectFieldInnerPublicProps
	& (
		| StaticSingleChoiceFieldProps
		| DynamicSingleChoiceFieldProps
	)
	& {
		searchByFields?: never
	}

export const NativeSelectField: FunctionComponent<NativeSelectFieldProps> = Component(
	props => (
		<ChoiceField {...props}>
			{(choiceProps: ChoiceFieldData.SingleChoiceFieldMetadata) => (
				<NativeSelectFieldInner {...props} {...choiceProps} />
			)}
		</ChoiceField>
	),
	'SelectField',
)

export interface NativeSelectFieldInnerPublicProps extends Omit<FieldContainerProps, 'children'> {
	placeholder?: string
	/**
	 * @deprecated Use `notNull` prop instead
	 */
	allowNull?: boolean
	notNull?: boolean
}

export interface NativeSelectFieldInnerProps extends ChoiceFieldData.SingleChoiceFieldMetadata, NativeSelectFieldInnerPublicProps, RefAttributes<HTMLSelectElement> {
	errors: FieldErrors | undefined
}

export const NativeSelectFieldInner = memo(forwardRef<HTMLSelectElement, NativeSelectFieldInnerProps>((props, ref) => {
	const isMutating = useMutationState()
	const labelMiddleware = useLabelMiddleware()
	const options: SelectOption<number>[] = props.data.map(({ key, label }) => {
		if (typeof label !== 'string') {
			throw new BindingError(`The labels of <SelectField /> items must be strings!`)
		}
		return {
			disabled: false,
			value: key,
			label: label,
		}
	})

	return (
		<FieldContainer {...props} label={labelMiddleware(props.label)}>
			<SelectCreateNewWrapper onClick={props.onAddNew}>
				<Select
					ref={ref}
					required={props.required}
					notNull={props.notNull ?? flipValue(props.allowNull)}
					value={props.currentValue}
					placeholder={props.placeholder}
					onChange={(value?: number | null) => {
						props.onChange(value ?? -1)
					}}
					options={options}
					loading={isMutating}
				/>
			</SelectCreateNewWrapper>
		</FieldContainer>
	)
}))
