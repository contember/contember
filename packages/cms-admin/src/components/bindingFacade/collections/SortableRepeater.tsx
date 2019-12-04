import { FieldSet } from '@contember/ui'
import * as React from 'react'
import { Component, HasMany, HasManyProps, useRelativeEntityList } from '../../../binding'
import { Repeater } from './Repeater'
import { Sortable, SortablePublicProps } from './Sortable'

export interface SortableRepeaterProps extends HasManyProps, Repeater.EntityListPublicProps {
	sortBy: SortablePublicProps['sortBy']
}

export const SortableRepeater = Component<SortableRepeaterProps>(
	props => {
		const entityList = useRelativeEntityList(props)

		return (
			<FieldSet legend={props.label} errors={entityList.errors}>
				<Sortable
					entities={entityList}
					sortBy={props.sortBy}
					label={props.label}
					enableAddingNew={props.enableAddingNew}
					enableUnlink={props.enableUnlink}
					enableUnlinkAll={props.enableUnlinkAll}
					removeType={props.removeType}
				>
					{props.children}
				</Sortable>
			</FieldSet>
		)
	},
	props => (
		<HasMany {...props}>
			<Sortable sortBy={props.sortBy}>{props.children}</Sortable>
		</HasMany>
	),
	'SortableRepeater',
)
