import { Component, HasMany } from '@contember/binding'
import type { FunctionComponent } from 'react'
import type { ChoiceFieldData } from './ChoiceFieldData'
import { DynamicMultipleChoiceFieldProps, useDynamicMultipleChoiceField } from './useDynamicMultipleChoiceField'
import { renderDynamicChoiceFieldStatic } from './renderDynamicChoiceFieldStatic'

export const DynamicMultiChoiceField: FunctionComponent<DynamicMultipleChoiceFieldProps & ChoiceFieldData.MultiChoiceFieldProps> =
	Component(
		props => props.children(useDynamicMultipleChoiceField(props)),
		(props, environment) => {
			const { subTree, renderedOption } = renderDynamicChoiceFieldStatic(props, environment)

			return (
				<>
					{subTree}
					<HasMany field={props.field} expectedMutation="connectOrDisconnect" initialEntityCount={0}>
						{renderedOption}
					</HasMany>
				</>
			)
		},
		'DynamicMultiChoiceField',
	)
