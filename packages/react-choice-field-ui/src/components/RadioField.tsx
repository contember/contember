import { ComponentType, FC } from 'react'
import { RadioFieldRenderer, RadioFieldRendererProps, RadioFieldRendererPublicProps } from './rendering/RadioFieldRenderer'
import { createChoiceField, SimpleDynamicSingleChoiceFieldProps, StaticSingleChoiceFieldProps } from '@contember/react-choice-field'

export type RadioFieldProps =
	& RadioFieldRendererPublicProps
	& (
		| StaticSingleChoiceFieldProps
		| SimpleDynamicSingleChoiceFieldProps
	)


/**
 * @group Form Fields
 */
export const RadioField: ComponentType<RadioFieldProps> = createChoiceField<RadioFieldRendererPublicProps>({
	FieldRenderer: RadioFieldRenderer as FC<RadioFieldRendererProps<any>>,
})
