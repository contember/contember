import { Component, EntityAccessor, HasOne } from '@contember/react-binding'
import type { ComponentType } from 'react'
import { DynamicSingleChoiceFieldProps, useDynamicSingleChoiceField } from './hooks/useDynamicSingleChoiceField'
import { renderDynamicChoiceFieldStatic } from './renderDynamicChoiceFieldStatic'
import { SingleChoiceFieldRendererProps } from './Renderers'

export type AllDynamicSingleChoiceFieldRenderer<OwnRendererProps extends {}> =
	& DynamicSingleChoiceFieldProps
	& SingleChoiceFieldRendererProps<EntityAccessor>
	& OwnRendererProps

export const createDynamicSingleChoiceField = <RendererProps extends {}>({ FieldRenderer }: {
	FieldRenderer: ComponentType<AllDynamicSingleChoiceFieldRenderer<RendererProps>>
}) => Component<DynamicSingleChoiceFieldProps & Omit<RendererProps, keyof AllDynamicSingleChoiceFieldRenderer<{}>>>(
	props => {
		const rendererProps = useDynamicSingleChoiceField(props)

		return <FieldRenderer {...props as DynamicSingleChoiceFieldProps & RendererProps} {...rendererProps} />
	},
	(props, environment) => {
		const { subTree, renderedOption } = renderDynamicChoiceFieldStatic(props, environment)

		return (
			<>
				{subTree}
				<HasOne field={props.field} expectedMutation="connectOrDisconnect">
					{renderedOption}
				</HasOne>
			</>
		)
	},
	'DynamicSingleChoiceField',
)
