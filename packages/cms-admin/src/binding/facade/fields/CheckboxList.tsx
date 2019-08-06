import * as React from 'react'
import { Checkbox, FormGroup, FormGroupProps } from '../../../components/ui'
import { FieldName } from '../../bindingTypes'
import { Component } from '../auxiliary'
import { ChoiceArity, ChoiceField, ChoiceFieldProps, MultipleChoiceFieldMetadata } from './ChoiceField'

export interface CheckboxListPublicProps {
	name: FieldName
	label?: FormGroupProps['label']
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
				<FormGroup label={environment.applySystemMiddleware('labelMiddleware', props.label)} errors={errors}>
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
	'CheckboxList'
)
