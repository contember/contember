import { FormGroup, FormGroupProps } from '@contember/ui'
import * as React from 'react'
import { Checkbox } from '../../../components/ui'
import { FieldName } from '../../bindingTypes'
import { Component } from '../../coreComponents'
import { ChoiceArity, ChoiceField, ChoiceFieldProps, MultipleChoiceFieldMetadata } from './ChoiceField'

export interface CheckboxListPublicProps extends Omit<FormGroupProps, 'children'> {
	name: FieldName
}

export interface CheckboxListInternalProps {
	options: ChoiceFieldProps['options']
}

export type CheckboxListProps = CheckboxListPublicProps & CheckboxListInternalProps

export const CheckboxList = Component<CheckboxListProps>(
	props => (
		<ChoiceField name={props.name} options={props.options} arity={ChoiceArity.Multiple}>
			{({ data, currentValues, onChange, environment, isMutating, errors }: MultipleChoiceFieldMetadata) => (
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
