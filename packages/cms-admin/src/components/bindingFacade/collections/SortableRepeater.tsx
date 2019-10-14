import { FieldSet } from '@contember/ui'
import * as React from 'react'
import { useEnvironment } from '../../../binding/accessorRetrievers'
import { Component, ToMany, ToManyProps } from '../../../binding/coreComponents'
import { EntityCollectionAccessor } from '../../../binding/dao'
import { QueryLanguage } from '../../../binding/queryLanguage'
import { Repeater } from './Repeater'
import { Sortable, SortablePublicProps } from './Sortable'

export interface SortableRepeaterProps extends ToManyProps, Repeater.EntityCollectionPublicProps {
	sortBy: SortablePublicProps['sortBy']
}

export const SortableRepeater = Component<SortableRepeaterProps>(
	props => {
		const environment = useEnvironment()

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
