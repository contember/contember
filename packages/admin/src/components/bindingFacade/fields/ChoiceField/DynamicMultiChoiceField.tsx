import { Component, EntityAccessor, HasMany, HasManyProps, HasOne, SugaredField } from '@contember/binding'
import type { FunctionComponent } from 'react'
import type { ChoiceFieldData } from './ChoiceFieldData'
import { DynamicMultipleChoiceFieldProps, useDynamicMultipleChoiceField } from './hooks/useDynamicMultipleChoiceField'
import { renderDynamicChoiceFieldStatic } from './renderDynamicChoiceFieldStatic'
import { useDynamicMultipleChoiceWithConnectingEntityField } from './hooks/useDynamicMultipleChoiceWithConnectingEntityField'

export const DynamicMultiChoiceField: FunctionComponent<DynamicMultipleChoiceFieldProps & ChoiceFieldData.MultiChoiceFieldProps<EntityAccessor>> =
	Component(
		props => {
			const choiceFieldMetadata = 'connectingEntityField' in props
				? useDynamicMultipleChoiceWithConnectingEntityField(props)
				: useDynamicMultipleChoiceField(props)
			return props.children(choiceFieldMetadata)
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
