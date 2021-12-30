import { Component, Field, FieldBasicProps, useEnvironment, useField, useMutationState } from '@contember/binding'
import { Checkbox, FieldContainer } from '@contember/ui'
import type { FunctionComponent, ReactNode } from 'react'
import { useAccessorErrors } from '../errors'

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
			<FieldContainer label={undefined} useLabelElement={false}>
				<Checkbox
					labelDescription={props.labelDescription}
					value={field.value}
					onChange={(isChecked: boolean) => {
						field.updateValue(isChecked)
					}}
					isDisabled={isMutating}
					errors={useAccessorErrors(field)}
				>
					{environment.applySystemMiddleware('labelMiddleware', props.label)}
				</Checkbox>
			</FieldContainer>
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
