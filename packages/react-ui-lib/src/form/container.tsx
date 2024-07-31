import * as React from 'react'
import { ReactNode } from 'react'
import { FormContainerUI, FormDescriptionUI, FormErrorUI, FormLabelUI, FormLabelWrapperUI } from './ui'
import { useErrorFormatter } from '../errors'
import { Component } from '@contember/interface'
import { FormError, FormLabel } from '@contember/react-form'

export interface FormContainerProps {
	label?: ReactNode
	description?: ReactNode
	children: ReactNode
	errors?: ReactNode
	required?: boolean
}


export const StandaloneFormContainer = ({ children, description, label, errors, required }: FormContainerProps) => (
	<FormContainerUI>
		<FormLabelWrapperUI>
			{label &&
				<FormLabelUI required={required}>
					{label}
				</FormLabelUI>
			}
		</FormLabelWrapperUI>
		<div>
			{children}
		</div>
		<div>
			{description && <FormDescriptionUI>
				{description}
			</FormDescriptionUI>}
			{errors}
		</div>
	</FormContainerUI>
)

export const FormContainer = Component(({ children, description, label, required }: FormContainerProps) => (
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
		</div>
	</FormContainerUI>
), ({ children, label, description }) => <>
	{label}
	{children}
	{description}
</>)
