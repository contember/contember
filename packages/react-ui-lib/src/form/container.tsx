import * as React from 'react'
import { ReactNode } from 'react'
import { FormContainerUI, FormDescriptionUI, FormErrorUI, FormLabelUI, FormLabelWrapperUI } from './ui'
import { useErrorFormatter } from '../errors'
import { Component, ErrorAccessor } from '@contember/interface'
import { FormError, FormFieldStateProvider, FormLabel, useFormFieldState } from '@contember/react-form'
import { useFieldLabelFormatter } from '../labels'

export interface FormContainerProps {
	label?: ReactNode
	description?: ReactNode
	children: ReactNode
	errors?: ErrorAccessor.Error[] | ReactNode
	required?: boolean
}

/**
 * FormContainer component for wrapping form elements with consistent styling and functionality.
 *
 * #### Features
 * - Automatic label generation from field name when not provided
 * - Error message display handling
 * - Required indicator support
 * - Description text support
 * - Automatic form state management when not in a FormField context
 *
 * #### Example: Basic usage
 * ```tsx
 * <FormContainer label="Username" description="Enter your login name">
 *   <InputField field="username" />
 * </FormContainer>
 * ```
 *
 * #### Example: With custom error handling
 * ```tsx
 * <FormContainer
 *   label="Email"
 *   errors={customErrors}
 * >
 *   <InputField field="email" />
 * </FormContainer>
 * ```
 *
 * #### Example: Auto-generated label
 * ```tsx
 * <FormContainer>
 *   <InputField field="createdAt" />
 * </FormContainer>
 * ```
 */
export const FormContainer = Component(({ children, description, label, required, errors }: FormContainerProps) => {
	const errorsNode = Array.isArray(errors) ? undefined : errors
	const errorsList = Array.isArray(errors) ? errors : []
	const state = useFormFieldState()
	const fieldLabelFormatter = useFieldLabelFormatter()
	label ??= state?.field ? fieldLabelFormatter(state.field.entityName, state.field.fieldName) : undefined

	const inner = <>
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
			<div>
				{description && <FormDescriptionUI>
					{description}
				</FormDescriptionUI>}

				<FormError formatter={useErrorFormatter()}>
					<FormErrorUI />
				</FormError>
				{errorsNode}
			</div>
		</FormContainerUI>
	</>
	return state !== undefined
		? inner
		: <FormFieldStateProvider required={required} errors={errorsList} dirty={false}>{inner}</FormFieldStateProvider>
}, ({ children, label, description }) => <>
	{label}
	{children}
	{description}
</>)

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
 *   <InputField field="name" />
 * </StandaloneFormContainer>
 *
 * // New:
 * <FormContainer label="Name">
 *   <InputField field="name" />
 * </FormContainer>
 * ```
 */
export const StandaloneFormContainer = FormContainer
