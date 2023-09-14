import { ComponentType, FC } from 'react'
import { SelectFieldRenderer, SelectFieldRendererProps, SelectFieldRendererPublicProps } from './rendering/SelectFieldRenderer'
import { createChoiceField, DynamicSingleChoiceFieldProps, StaticSingleChoiceFieldProps } from '@contember/react-choice-field'


export type SelectFieldProps =
	& SelectFieldRendererPublicProps
	& (
		| StaticSingleChoiceFieldProps
		| DynamicSingleChoiceFieldProps
	)

/**
 * @group Form Fields
 */
export const SelectField: ComponentType<SelectFieldProps> = createChoiceField<SelectFieldRendererPublicProps>({
	FieldRenderer: SelectFieldRenderer as FC<SelectFieldRendererProps<any>>,
})
