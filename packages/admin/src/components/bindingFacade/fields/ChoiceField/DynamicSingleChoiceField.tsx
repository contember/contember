import { Component, HasOne } from '@contember/binding'
import type { FunctionComponent } from 'react'
import type { ChoiceFieldData } from './ChoiceFieldData'
import { DynamicSingleChoiceFieldProps, useDynamicSingleChoiceField } from './useDynamicSingleChoiceField'
import { renderDynamicChoiceFieldStatic } from './renderDynamicChoiceFieldStatic'

export const DynamicSingleChoiceField: FunctionComponent<DynamicSingleChoiceFieldProps & ChoiceFieldData.SingleChoiceFieldProps> =
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
