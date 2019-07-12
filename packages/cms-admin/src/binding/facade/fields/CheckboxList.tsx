import * as React from 'react'
import { FormGroup, FormGroupProps } from '../../../components/ui'
import { FieldName } from '../../bindingTypes'
import { Component } from '../aux'
import { ChoiceArity, ChoiceField, ChoiceFieldProps } from './ChoiceField'

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
			{({ data, currentValues, onChange, environment, isMutating, errors }) => (
				// TODO this formGroup should be a fieldset
				<FormGroup label={environment.applySystemMiddleware('labelMiddleware', props.label)} errors={errors}>
					{data.map(({ key, label }) => (
						<div key={key}>
							<label>
								<input
									type="checkbox"
									readOnly={isMutating}
									checked={(currentValues || []).indexOf(key) !== -1}
									onChange={e => onChange(key, e.currentTarget.checked)}
								/>
								{label}
							</label>
						</div>
					))}
				</FormGroup>
			)}
		</ChoiceField>
	),
	'CheckboxList'
)
