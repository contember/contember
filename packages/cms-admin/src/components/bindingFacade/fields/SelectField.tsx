import { FormGroup, FormGroupProps, Select, SelectOption } from '@contember/ui'
import * as React from 'react'
import { Component, DataBindingError, ErrorAccessor } from '../../../binding'

import { ChoiceField, ChoiceFieldData, ChoiceFieldProps } from './ChoiceField'

export interface SelectFieldPublicProps
	extends SelectFieldInnerPublicProps,
		Omit<ChoiceFieldProps<'single'>, 'children'> {}

export type SelectFieldProps = SelectFieldPublicProps

export const SelectField = Component<SelectFieldProps>(props => {
	return (
		<ChoiceField {...(props as any)} arity="single">
			{({
				data,
				currentValue,
				onChange,
				errors,
				environment,
				isMutating,
			}: ChoiceFieldData.SingleChoiceFieldMetadata) => {
				return (
					<SelectFieldInner
						label={props.label}
						allowNull={props.allowNull}
						firstOptionCaption={props.firstOptionCaption}
						data={data}
						currentValue={currentValue}
						onChange={onChange}
						environment={environment}
						errors={errors}
						isMutating={isMutating}
					/>
				)
			}}
		</ChoiceField>
	)
}, 'SelectField')

export interface SelectFieldInnerPublicProps extends Omit<FormGroupProps, 'children'> {
	firstOptionCaption?: string
	allowNull?: boolean
}

export interface SelectFieldInnerProps extends ChoiceFieldData.SingleChoiceFieldMetadata, SelectFieldInnerPublicProps {
	errors: ErrorAccessor[]
}

export class SelectFieldInner extends React.PureComponent<SelectFieldInnerProps> {
	public render() {
		const options = Array<SelectOption>({
			disabled: this.props.allowNull !== true,
			value: -1,
			label: this.props.firstOptionCaption || (typeof this.props.label === 'string' ? this.props.label : ''),
		}).concat(
			this.props.data.map(({ key, label }) => {
				if (typeof label !== 'string') {
					throw new DataBindingError(`The labels of <SelectField /> items must be strings!`)
				}
				return {
					disabled: false,
					value: key,
					label: label,
				}
			}),
		)

		return (
			<FormGroup
				{...this.props}
				label={this.props.environment.applySystemMiddleware('labelMiddleware', this.props.label)}
			>
				<Select
					value={this.props.currentValue.toString()}
					onChange={event => {
						this.props.onChange(parseInt(event.currentTarget.value, 10))
					}}
					options={options}
					disabled={this.props.isMutating}
				/>
			</FormGroup>
		)
	}
}
