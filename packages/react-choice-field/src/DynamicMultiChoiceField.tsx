import { Component, HasMany, HasManyProps, HasOne, SugaredField } from '@contember/react-binding'
import type { ComponentType } from 'react'
import { DynamicMultipleChoiceFieldProps, useDynamicMultipleChoiceField } from './hooks/useDynamicMultipleChoiceField'
import { renderDynamicChoiceFieldStatic } from './renderDynamicChoiceFieldStatic'
import { useDynamicMultipleChoiceWithConnectingEntityField } from './hooks/useDynamicMultipleChoiceWithConnectingEntityField'
import { DynamicMultiChoiceFieldRendererProps } from './Renderers'

export type AllDynamicMultiChoiceFieldRendererProps<RendererOwnProps extends {}> =
	& DynamicMultiChoiceFieldRendererProps
	& DynamicMultipleChoiceFieldProps
	& RendererOwnProps

export const createDynamicMultiChoiceField = <RendererProps extends {}>({ FieldRenderer }: {
	FieldRenderer: ComponentType<AllDynamicMultiChoiceFieldRendererProps<RendererProps>>
}) => Component<DynamicMultipleChoiceFieldProps & Omit<RendererProps, keyof AllDynamicMultiChoiceFieldRendererProps<{}>>>(
	props => {
		const rendererProps = 'connectingEntityField' in props && props.connectingEntityField
			? useDynamicMultipleChoiceWithConnectingEntityField(props)
			: useDynamicMultipleChoiceField(props)

		return <FieldRenderer {...(props as DynamicMultipleChoiceFieldProps & RendererProps)} {...rendererProps} />
	},
	(props, environment) => {
		let { subTree, renderedOption } = renderDynamicChoiceFieldStatic(props, environment)

		let expectedMutation: HasManyProps['expectedMutation'] = 'connectOrDisconnect'

		if ('connectingEntityField' in props && props.connectingEntityField) {
			expectedMutation = 'anyMutation'

			const hasOneProps = typeof props.connectingEntityField === 'string'
				? { field: props.connectingEntityField }
				: props.connectingEntityField

			renderedOption = <>
				<HasOne {...hasOneProps} expectedMutation={'connectOrDisconnect'}>
					{renderedOption}
				</HasOne>
			</>
		}

		return (
			<>
				{subTree}
				<HasMany field={props.field} expectedMutation={expectedMutation} initialEntityCount={0}>
					{props.sortableBy && <SugaredField field={props.sortableBy} />}
					{renderedOption}
				</HasMany>
			</>
		)
	},
	'DynamicMultiChoiceField',
)
