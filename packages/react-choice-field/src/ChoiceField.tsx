import { Component } from '@contember/react-binding'
import type { ComponentType, FunctionComponent } from 'react'
import {
	AllStaticSingleChoiceFieldRendererProps,
	createStaticSingleChoiceField,
	StaticSingleChoiceFieldProps,
} from './StaticSingleChoiceField'
import { AllDynamicSingleChoiceFieldRenderer, createDynamicSingleChoiceField } from './DynamicSingleChoiceField'
import { DynamicSingleChoiceFieldProps } from './hooks/useDynamicSingleChoiceField'

export type ChoiceFieldProps =
	| StaticSingleChoiceFieldProps
	| DynamicSingleChoiceFieldProps

export const createChoiceField = <RendererProps extends {}>({ FieldRenderer }:{
	FieldRenderer: ComponentType<AllDynamicSingleChoiceFieldRenderer<RendererProps> | AllStaticSingleChoiceFieldRendererProps<RendererProps>>
}): FunctionComponent<ChoiceFieldProps & RendererProps> => {
	const StaticSingleChoiceField = createStaticSingleChoiceField<RendererProps>({
		FieldRenderer: FieldRenderer as ComponentType<AllStaticSingleChoiceFieldRendererProps<RendererProps>>,
	})
	const DynamicSingleChoiceField = createDynamicSingleChoiceField<RendererProps>({
		FieldRenderer: FieldRenderer as ComponentType<AllDynamicSingleChoiceFieldRenderer<RendererProps>>,
	})

	return Component(props => {
		return Array.isArray(props.options)
			? <StaticSingleChoiceField {...props as StaticSingleChoiceFieldProps & RendererProps} />
			: <DynamicSingleChoiceField {...props as DynamicSingleChoiceFieldProps & RendererProps} />
	}, 'ChoiceField')
}
