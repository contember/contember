import * as React from 'react'
import { FormGroup } from '../../../components'
import { EnvironmentContext, Props, ToMany, ToManyProps } from '../../coreComponents'
import { EntityCollectionAccessor } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'
import { Component } from '../auxiliary'
import { Repeater } from './Repeater'
import { Sortable, SortablePublicProps } from './Sortable'

interface SortableRepeaterProps extends ToManyProps, Repeater.EntityCollectionPublicProps {
	sortBy: SortablePublicProps['sortBy']
	children: React.ReactNode
}

export const SortableRepeater = Component(
	(props: SortableRepeaterProps) => {
		const environment = React.useContext(EnvironmentContext)

		return QueryLanguage.wrapRelativeEntityList(
			props.field,
			atomicPrimitiveProps => (
				<ToMany.AccessorRetriever {...atomicPrimitiveProps}>
					{(field: EntityCollectionAccessor) => (
						// Intentionally not applying label system middleware
						<FormGroup label={props.label} errors={field.errors}>
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
						</FormGroup>
					)}
				</ToMany.AccessorRetriever>
			),
			environment,
		)
	},
	(props: Props<SortableRepeaterProps>): React.ReactNode => {
		return (
			<ToMany field={props.field}>
				<Sortable sortBy={props.sortBy}>{props.children}</Sortable>
			</ToMany>
		)
	},
	'SortableRepeater',
)
