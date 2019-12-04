import { FormGroup, FormGroupProps } from '@contember/ui'
import * as React from 'react'
import { Component } from '../../../binding'
import { Checkbox } from '../../ui'
import { ChoiceField, ChoiceFieldData, ChoiceFieldProps } from './ChoiceField'

export type CheckboxListProps = Omit<FormGroupProps, 'children'> & ChoiceFieldProps<'single'>

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
