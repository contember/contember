import { ComponentType } from 'react'
import { MultiSelectFieldRendererPublicProps, MultiSelectFieldRenderer } from './rendering/MultiSelectFieldRenderer'
import { createDynamicMultiChoiceField, DynamicMultipleChoiceFieldProps } from '@contember/react-choice-field'

export type MultiSelectFieldProps =
	& MultiSelectFieldRendererPublicProps
	& DynamicMultipleChoiceFieldProps

export const MultiSelectField: ComponentType<MultiSelectFieldProps> = createDynamicMultiChoiceField<MultiSelectFieldRendererPublicProps>({
	FieldRenderer: MultiSelectFieldRenderer,
})
