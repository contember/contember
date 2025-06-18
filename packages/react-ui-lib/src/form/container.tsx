import { Component, ErrorAccessor } from '@contember/interface'
import { FormError, FormFieldStateProvider, FormLabel, useFormFieldState } from '@contember/react-form'
import { ReactNode } from 'react'
import { useErrorFormatter } from '../errors'
import { FormFieldLabel } from './labels'
import { FormContainerUI, FormDescriptionUI, FormErrorUI, FormLabelUI, FormLabelWrapperUI } from './ui'

/**
 * Props for the {@link FormContainer} component.
 */
export interface FormContainerProps {
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
	 * Indicates whether the form element
	 */
	required?: boolean
}

/**
 * Props {@link FormContainerProps}.
 *
 * `FormContainer` is a layout component for form fields, providing consistent styling and handling
 * of labels, descriptions, and error messages. It ensures accessibility and state management
 * within form contexts.
 *
 * #### Example: Basic usage
 * ```tsx
 * <FormContainer label="Email" description="Enter a valid email address" required errors={errors}>
 *   <FormInput field="email" />
 * </FormContainer>
 * ```
 */
export const FormContainer = Component<FormContainerProps>(({ children, description, label, required, errors }) => {
	const errorsNode = Array.isArray(errors) ? undefined : errors
	const errorsList = Array.isArray(errors) ? errors : []
	const state = useFormFieldState()


	label ??= <FormFieldLabel />
	const errorFormatter = useErrorFormatter()

	const inner = (
		<>
			<FormContainerUI>
				<FormLabelWrapperUI>
					{label && <FormLabel>
						<FormLabelUI required={required}>
							{label}
						</FormLabelUI>
					</FormLabel>}
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
		</>
	)

	return state !== undefined
		? inner
		: <FormFieldStateProvider required={required} errors={errorsList} dirty={false}>{inner}</FormFieldStateProvider>
}, ({ children, label, description }) => (
	<>
		{label}
		{children}
		{description}
	</>
))

/**
 * @deprecated use `FormContainer` instead
 *
 * StandaloneFormContainer component.
 *
 * #### Deprecation Notice
 * This component is deprecated and will be removed in future versions.
 * Use `FormContainer` instead.
 *
 * #### Migration Example
 * ```tsx
 * // Old:
 * <StandaloneFormContainer label="Name">
 *   <FormInput field="name" />
 * </StandaloneFormContainer>
 *
 * // New:
 * <FormContainer label="Name">
 *   <FormInput field="name" />
 * </FormContainer>
 * ```
 */
export const StandaloneFormContainer = FormContainer
