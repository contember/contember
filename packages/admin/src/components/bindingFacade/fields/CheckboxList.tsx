import { Component } from '@contember/binding'
import { FormGroup, FormGroupProps } from '@contember/ui'
import { FunctionComponent } from 'react'
import { Checkbox } from '../../ui'
import { ChoiceField, ChoiceFieldData, DynamicMultipleChoiceFieldProps, StaticChoiceFieldProps } from './ChoiceField'

export type CheckboxListProps = Omit<FormGroupProps, 'children'> &
	(Omit<StaticChoiceFieldProps<'multiple'>, 'arity'> | DynamicMultipleChoiceFieldProps)

export const CheckboxList: FunctionComponent<CheckboxListProps> = Component(
	props => (
		<ChoiceField {...(props as any)} arity="multiple">
			{({ data, currentValues, onChange, isMutating }: ChoiceFieldData.MultipleChoiceFieldMetadata) => {
				// TODO this formGroup should be a fieldset
				const currentValueSet = new Set(currentValues)
				return (
					<FormGroup {...props}>
						{data.map(({ key, label }) => (
							<Checkbox
								key={key}
								checked={currentValueSet.has(key)}
								readOnly={isMutating}
								onChange={isChecked => onChange(key, isChecked)}
							>
								{label}
							</Checkbox>
						))}
					</FormGroup>
				)
			}}
		</ChoiceField>
	),
	'CheckboxList',
)
