import { Component, Field, FieldBasicProps, useEnvironment, useField, useMutationState } from '@contember/binding'
import { Checkbox, FormGroup } from '@contember/ui'
import { FunctionComponent, ReactNode } from 'react'

export type CheckboxFieldProps = FieldBasicProps & {
	label: ReactNode
	labelDescription?: ReactNode
}

export const CheckboxField: FunctionComponent<CheckboxFieldProps> = Component(
	props => {
		const field = useField<boolean>(props)
		const isMutating = useMutationState()
		const environment = useEnvironment()

		return (
			<FormGroup label={undefined} useLabelElement={false}>
				<Checkbox
					labelDescription={props.labelDescription}
					value={field.value}
					onChange={(isChecked: boolean) => {
						field.updateValue(isChecked)
					}}
					isDisabled={isMutating}
					errors={field.errors}
				>
					{environment.applySystemMiddleware('labelMiddleware', props.label)}
				</Checkbox>
			</FormGroup>
		)
	},
	props => {
		// let isNonbearing = props.isNonbearing
		// let defaultValue = props.defaultValue
		//
		// if (props.defaultValue === undefined && props.isNonbearing !== false) {
		// 	defaultValue = false
		// 	isNonbearing = true
		// }

		return (
			<>
				<Field {...props} />
				{props.label}
				{props.labelDescription}
			</>
		)
	},
	'CheckboxField',
)
