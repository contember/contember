import { FieldSet } from '@contember/ui'
import * as React from 'react'
import { EnvironmentContext, ToMany, ToManyProps } from '../../coreComponents'
import { EntityCollectionAccessor } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'
import { Component } from '../auxiliary'
import { Repeater } from './Repeater'
import { Sortable, SortablePublicProps } from './Sortable'

export interface SortableRepeaterProps extends ToManyProps, Repeater.EntityCollectionPublicProps {
	sortBy: SortablePublicProps['sortBy']
}

export const SortableRepeater = Component<SortableRepeaterProps>(
	props => {
		const environment = React.useContext(EnvironmentContext)

		return QueryLanguage.wrapRelativeEntityList(
			props.field,
			atomicPrimitiveProps => (
				<ToMany.AccessorRetriever {...atomicPrimitiveProps}>
					{(field: EntityCollectionAccessor) => (
						// Intentionally not applying label system middleware
						<FieldSet legend={props.label} errors={field.errors}>
							<Sortable
								entities={field}
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
					)}
				</ToMany.AccessorRetriever>
			),
			environment,
		)
	},
	props => (
		<ToMany field={props.field}>
			<Sortable sortBy={props.sortBy}>{props.children}</Sortable>
		</ToMany>
	),
	'SortableRepeater',
)
