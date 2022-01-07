import { BindingError, Component, ErrorAccessor } from '@contember/binding'
import { FieldContainer, FieldContainerProps, Select, SelectOption } from '@contember/ui'
import { FunctionComponent, memo } from 'react'
import { ChoiceField, ChoiceFieldData, DynamicSingleChoiceFieldProps, StaticSingleChoiceFieldProps } from '../ChoiceField'

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
	allowNull?: boolean
}

export interface NativeSelectFieldInnerProps extends ChoiceFieldData.SingleChoiceFieldMetadata, NativeSelectFieldInnerPublicProps {
	errors: ErrorAccessor | undefined
}

export const NativeSelectFieldInner = memo((props: NativeSelectFieldInnerProps) => {
	const options = Array<SelectOption>({
		disabled: props.allowNull !== true,
		value: -1,
		label: props.placeholder || (typeof props.label === 'string' ? props.label : ''),
	}).concat(
		props.data.map(({ key, label }) => {
			if (typeof label !== 'string') {
				throw new BindingError(`The labels of <SelectField /> items must be strings!`)
			}
			return {
				disabled: false,
				value: key,
				label: label,
			}
		}),
	)

	return (
		<FieldContainer {...props} label={props.environment.applySystemMiddleware('labelMiddleware', props.label)}>
			<Select
				value={props.currentValue.toString()}
				onChange={event => {
					props.onChange(parseInt(event.currentTarget.value, 10))
				}}
				options={options}
				disabled={props.isMutating}
			/>
		</FieldContainer>
	)
})
