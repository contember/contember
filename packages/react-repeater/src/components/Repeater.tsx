import { ReactNode, useEffect, useMemo } from 'react'
import { useCreateRepeaterMethods } from '../internal/useCreateRepeaterMethods'
import { RepeaterEntityListAccessorContext, RepeaterMethodsContext, RepeaterSortedEntitiesContext } from '../contexts'
import { Component, EntityListSubTree, HasMany, repairEntitiesOrder, sortEntities, SugaredField, useEntityList, useEntityListSubTree, useEnvironment } from '@contember/react-binding'
import { EntityListAccessor, QueryLanguage, SugaredQualifiedEntityList, SugaredRelativeEntityList, SugaredRelativeSingleField, SugaredOrderBy } from '@contember/react-binding'

export type RepeaterRelativeProps =
	& Omit<SugaredRelativeEntityList, 'orderBy'>
	& {
		children?: ReactNode
		orderBy?: SugaredOrderBy | false
		sortableBy?: SugaredRelativeSingleField['field']
	}

export type RepeaterQualifiedProps =
	& Omit<SugaredQualifiedEntityList, 'orderBy'>
	& {
		children?: ReactNode
		orderBy?: SugaredOrderBy | false
		sortableBy?: SugaredRelativeSingleField['field']
	}

export type RepeaterProps =
	| RepeaterQualifiedProps
	| RepeaterRelativeProps

/**
 * @group Blocks and repeaters
 */
export const Repeater = Component<RepeaterProps>(props => {
	if ('entities' in props) {
		return <RepeaterQualified {...props} />
	}

	return <RepeaterRelative {...props} />
})

const useSortableBy = (sortableBy?: SugaredRelativeSingleField['field']) => {
	const environment = useEnvironment()
	return useMemo(() => sortableBy ? QueryLanguage.desugarRelativeSingleField(sortableBy, environment) : undefined, [environment, sortableBy])
}

const RepeaterRelative = Component(
	(props: RepeaterRelativeProps) => {
		const desugarSortableBy = useSortableBy(props.sortableBy)
		const entityList = useEntityList({
			...props,
			orderBy: props.orderBy === false ? undefined : props.orderBy ?? desugarSortableBy?.field,
		})

		return (
			<RepeaterInner accessor={entityList} sortableBy={props.sortableBy}>
				{props.children}
			</RepeaterInner>
		)
	},
	(props, environment) => {
		const desugarSortableBy = props.sortableBy
			? QueryLanguage.desugarRelativeSingleField(props.sortableBy, environment)
			: undefined

		return (
			<HasMany {...props} orderBy={props.orderBy === false ? undefined : props.orderBy ?? desugarSortableBy?.field}>
				{props.children}
				{props.sortableBy && <SugaredField field={props.sortableBy} isNonbearing />}
			</HasMany>
		)
	},
	'Repeater',
)

const RepeaterQualified = Component(
	(props: RepeaterQualifiedProps) => {
		const desugarSortableBy = useSortableBy(props.sortableBy)
		const entityList = useEntityListSubTree({
			...props,
			orderBy: props.orderBy === false ? undefined : props.orderBy ?? desugarSortableBy?.field,
		})

		return (
			<RepeaterInner accessor={entityList} sortableBy={props.sortableBy}>
				{props.children}
			</RepeaterInner>
		)
	},
	(props, environment) => {
		const desugarSortableBy = props.sortableBy
			? QueryLanguage.desugarRelativeSingleField(props.sortableBy, environment)
			: undefined

		return (
			<EntityListSubTree {...props} orderBy={props.orderBy === false ? undefined : props.orderBy ?? desugarSortableBy?.field}>
				{props.children}
				{props.sortableBy && <SugaredField field={props.sortableBy} isNonbearing />}
			</EntityListSubTree>
		)
	},
	'Repeater',
)

interface RepeaterInnerProps {
	accessor: EntityListAccessor
	children: React.ReactNode
	sortableBy?: SugaredRelativeSingleField['field']
}

const RepeaterInner = ({ sortableBy, accessor, children }: RepeaterInnerProps) => {
	const desugaredSortableByField = useSortableBy(sortableBy)
	const sortedEntities = useMemo(() => sortEntities(Array.from(accessor), desugaredSortableByField), [desugaredSortableByField, accessor])

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
