import React, { useEffect, useMemo } from 'react'
import { verifySortableProp } from '../internal/verifySortableProp'
import { useCreateRepeaterMethods } from '../internal/useCreateRepeaterMethods'
import { RepeaterEntityListAccessorContext, RepeaterMethodsContext, RepeaterSortedEntitiesContext } from '../contexts'
import { Component, EntityListSubTree, HasMany, repairEntitiesOrder, sortEntities, SugaredField, useEntityList, useEntityListSubTree, useEnvironment } from '@contember/react-binding'
import { EntityListAccessor, QueryLanguage, SugaredQualifiedEntityList, SugaredRelativeEntityList, SugaredRelativeSingleField } from '@contember/react-binding'

export type RepeaterRelativeProps =
	& SugaredRelativeEntityList
	& {
		children?: React.ReactNode
		sortableBy?: SugaredRelativeSingleField['field']
	}

export type RepeaterQualifiedProps =
	& SugaredQualifiedEntityList
	& {
		children?: React.ReactNode
		sortableBy?: SugaredRelativeSingleField['field']
	}

export type RepeaterProps =
	| RepeaterQualifiedProps
	| RepeaterRelativeProps

/**
 * @group Blocks and repeaters
 */
export const Repeater = Component<RepeaterProps>(props => {
	if (import.meta.env.DEV) {
		verifySortableProp(props)
	}

	if ('entities' in props) {
		return <RepeaterQualified {...props} />
	}
	return <RepeaterRelative {...props} />
})


const RepeaterRelative = Component(
	(props: RepeaterRelativeProps) => {
		const entityList = useEntityList(props)

		return (
			<RepeaterInner accessor={entityList} sortableBy={props.sortableBy}>
				{props.children}
			</RepeaterInner>
		)
	},
	(props, environment) => (
		<HasMany {...props}>
			{props.children}
			{props.sortableBy && <SugaredField field={props.sortableBy} isNonbearing />}
		</HasMany>
	),
	'Repeater',
)

const RepeaterQualified = Component(
	(props: RepeaterQualifiedProps) => {
		const entityList = useEntityListSubTree(props)
		return (
			<RepeaterInner accessor={entityList} sortableBy={props.sortableBy}>
				{props.children}
			</RepeaterInner>
		)
	},
	(props, environment) => (
		<EntityListSubTree {...props}>
			{props.children}
			{props.sortableBy && <SugaredField field={props.sortableBy} isNonbearing />}
		</EntityListSubTree>
	),
	'Repeater',
)


interface RepeaterInnerProps {
	accessor: EntityListAccessor
	children: React.ReactNode
	sortableBy?: SugaredRelativeSingleField['field']
}

const RepeaterInner = ({ sortableBy, accessor, children }: RepeaterInnerProps) => {
	const environment = useEnvironment()
	const desugaredSortableByField = useMemo(() => sortableBy ? QueryLanguage.desugarRelativeSingleField(sortableBy, environment) : undefined, [environment, sortableBy])
	const sortedEntities = useMemo(() => {
		return sortEntities(Array.from(accessor), desugaredSortableByField)
	}, [desugaredSortableByField, accessor])

	useEffect(() => {
		if (!desugaredSortableByField) {
			return
		}
		repairEntitiesOrder(desugaredSortableByField, sortedEntities)
	}, [desugaredSortableByField, sortedEntities])

	const methods = useCreateRepeaterMethods({ accessor, sortableBy: desugaredSortableByField })

	return (
		<RepeaterEntityListAccessorContext.Provider value={accessor}>
			<RepeaterSortedEntitiesContext.Provider value={sortedEntities}>
				<RepeaterMethodsContext.Provider value={methods}>
					{children}
				</RepeaterMethodsContext.Provider>
			</RepeaterSortedEntitiesContext.Provider>
		</RepeaterEntityListAccessorContext.Provider>
	)
}
