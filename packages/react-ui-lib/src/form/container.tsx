import { ReactNode } from 'react'
import { FormContainerUI, FormDescriptionUI, FormErrorUI, FormLabelUI, FormLabelWrapperUI } from './ui'
import { useErrorFormatter } from '../errors'
import { Component, ErrorAccessor, useLabelMiddleware } from '@contember/interface'
import { FormError, FormFieldStateProvider, FormLabel, useFormFieldState } from '@contember/react-form'
import { FormFieldLabel } from './labels'

export type FormContainerProps = {
	label?: ReactNode
	description?: ReactNode
	children: ReactNode
	errors?: ErrorAccessor.Error[] | ReactNode
	required?: boolean
}

export const FormContainer = Component(
	({ children, description, label, required, errors }: FormContainerProps) => {
		const errorsNode = Array.isArray(errors) ? undefined : errors
		const errorsList = Array.isArray(errors) ? errors : []
		const state = useFormFieldState()
		const labelMiddleware = useLabelMiddleware()
		label ??= <FormFieldLabel />
		const errorFormatter = useErrorFormatter()

		const inner = (
			<FormContainerUI>
				<FormLabelWrapperUI>
					{label && labelMiddleware(<>
						<FormLabel>
							<FormLabelUI required={required}>
								{label}
							</FormLabelUI>
						</FormLabel>
					</>)}
				</FormLabelWrapperUI>
				<div>
					{children}
				</div>
				{(description || errorsNode || state?.errors?.length || errorsList?.length) ? <div>
					{description && <FormDescriptionUI>{description}</FormDescriptionUI>}

					<FormError formatter={errorFormatter}>
						<FormErrorUI />
					</FormError>
					{errorsNode}
				</div> : null}
			</FormContainerUI>
		)

		return state !== undefined
			? inner
			: <FormFieldStateProvider required={required} errors={errorsList} dirty={false}>{inner}</FormFieldStateProvider>
	},
	({ children, label, description }) => (
		<>
			{label}
			{children}
			{description}
		</>
	),
)

/**
 * @deprecated use `FormContainer` instead
 */
export const StandaloneFormContainer = FormContainer
