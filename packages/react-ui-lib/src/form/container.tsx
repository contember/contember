import { ReactNode } from 'react'
import { FormContainerUI, FormDescriptionUI, FormErrorUI, FormLabelUI, FormLabelWrapperUI } from '@contember/react-ui-lib-base'
import { useErrorFormatter } from '../errors/index.js'
import { Component, ErrorAccessor, useLabelMiddleware } from '@contember/interface'
import { FormError, FormFieldStateProvider, FormLabel, useFormFieldState } from '@contember/react-form'
import { FormFieldLabel } from './labels.js'

/**
 * Props for the {@link FormContainer} component.
 */
export type FormContainerProps = {
	/**
	 * The label for the form element.
	 */
	label?: ReactNode
	/**
	 * The description text for the form element.
	 */
	description?: ReactNode
	/**
	 * The child components or form elements to render within the container.
	 */
	children: ReactNode
	/**
	 * The error message to display.
	 */
	errors?: ErrorAccessor.Error[] | ReactNode
	/**
	 * Indicates whether the form element is required.
	 */
	required?: boolean
}

/**
 * `FormContainer` is a layout component for form fields, providing consistent styling and handling
 * of labels, descriptions, and error messages. It ensures accessibility and state management
 * within form contexts.
 *
 * ## Example: Basic usage
 * ```tsx
 * <FormContainer label="Email" description="Enter a valid email address" required errors={errors}>
 *   <FormInput field="email" />
 * </FormContainer>
 * ```
 */
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
					{label && labelMiddleware(
						<>
							<FormLabel>
								<FormLabelUI required={required}>
									{label}
								</FormLabelUI>
							</FormLabel>
						</>,
					)}
				</FormLabelWrapperUI>
				<div>
					{children}
				</div>
				{(description || errorsNode || state?.errors?.length || errorsList?.length)
					? (
						<div>
							{description && <FormDescriptionUI>{description}</FormDescriptionUI>}

							<FormError formatter={errorFormatter}>
								<FormErrorUI />
							</FormError>
							{errorsNode}
						</div>
					)
					: null}
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
