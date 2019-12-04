import { ButtonProps } from '@contember/ui'
import * as React from 'react'
import {
	Component,
	Field,
	HasMany,
	HasManyProps,
	SugaredRelativeSingleField,
	useRelativeEntityList,
	useSortedEntities,
} from '../../../../binding'

export interface RepeaterProps extends HasManyProps {
	label: React.ReactNode

	sortBy?: SugaredRelativeSingleField['name']
	initialRowCount?: number

	addButtonText?: React.ReactNode
	addButtonProps?: ButtonProps
	addButtonComponent?: React.ComponentType
}

export const Repeater = Component<RepeaterProps>(
	props => {
		const entityList = useRelativeEntityList(props)
		const entities = useSortedEntities(entityList, props.sortBy)

		return null
	},
	(props, environment) => (
		<HasMany
			{...props}
			preferences={{
				initialEntityCount: props.initialRowCount,
			}}
		>
			{props.sortBy && <Field name={props.sortBy} isNonbearing={true} />}
			{props.children}
		</HasMany>
	),
	'Repeater',
)
