import { Component, EntityAccessor, HasOne } from '@contember/binding'
import type { FunctionComponent } from 'react'
import type { ChoiceFieldData } from './ChoiceFieldData'
import { DynamicSingleChoiceFieldProps, useDynamicSingleChoiceField } from './hooks/useDynamicSingleChoiceField'
import { renderDynamicChoiceFieldStatic } from './renderDynamicChoiceFieldStatic'

export const DynamicSingleChoiceField: FunctionComponent<DynamicSingleChoiceFieldProps & ChoiceFieldData.SingleChoiceFieldProps<EntityAccessor>> =
	Component(
		props => props.children(useDynamicSingleChoiceField(props)),
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
