import { Component } from '@contember/binding'
import { FormGroup, FormGroupProps } from '@contember/ui'
import * as React from 'react'
import { Checkbox } from '../../ui'
import { ChoiceField, ChoiceFieldData, DynamicMultipleChoiceFieldProps, StaticChoiceFieldProps } from './ChoiceField'

export type CheckboxListProps = Omit<FormGroupProps, 'children'> &
	(Omit<StaticChoiceFieldProps<'multiple'>, 'arity'> | DynamicMultipleChoiceFieldProps)

export const CheckboxList = Component<CheckboxListProps>(
	props => (
		<ChoiceField {...(props as any)} arity="multiple">
			{({ data, currentValues, onChange, isMutating }: ChoiceFieldData.MultipleChoiceFieldMetadata) => (
				// TODO this formGroup should be a fieldset
				<FormGroup {...props}>
					{data.map(({ key, label }) => (
						<Checkbox
							key={key}
							checked={(currentValues || []).indexOf(key) !== -1}
							readOnly={isMutating}
							onChange={isChecked => onChange(key, isChecked)}
						>
							{label}
						</Checkbox>
					))}
				</FormGroup>
			)}
		</ChoiceField>
	),
	'CheckboxList',
)
