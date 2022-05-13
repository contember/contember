import { BindingError, Component } from '@contember/binding'
import { FieldContainer, FieldContainerProps, FieldErrors, flipValue, Select, SelectOption } from '@contember/ui'
import { forwardRef, FunctionComponent, memo, RefAttributes } from 'react'
import {
	ChoiceField,
	ChoiceFieldData,
	DynamicSingleChoiceFieldProps,
	StaticSingleChoiceFieldProps,
} from '../ChoiceField'

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
			{({
				data,
				currentValue,
				onChange,
				errors,
				environment,
				isMutating,
			}: ChoiceFieldData.SingleChoiceFieldMetadata) => (
				<NativeSelectFieldInner
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
		<FieldContainer {...props} label={props.environment.applyLabelMiddleware(props.label)}>
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
				loading={props.isMutating}
			/>
		</FieldContainer>
	)
}))
