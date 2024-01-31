import {
	Component,
	EntityListSubTree,
	Field,
	HasMany,
	HasOne,
	SugaredQualifiedEntityList,
	SugaredRelativeEntityList,
	SugaredRelativeSingleEntity,
	SugaredRelativeSingleField,
	useEntityList,
	useEntityListSubTree,
} from '@contember/react-binding'
import { boardColumnsAnalyzer, boardItemsAnalyzer } from '../internal/boardAnalyzer'
import { Fragment, ReactNode } from 'react'
import { useDynamicBoard } from '../internal/useDynamicBoard'
import { useStaticBoard } from '../internal/useStaticBoard'
import { BoardColumnsContext, BoardMethodsContext } from '../contexts'

export type BoardProps =
	| BoardQualifiedDynamicProps
	| BoardRelativeDynamicProps
	| BoardQualifiedStaticProps
	| BoardRelativeStaticProps


export const Board = Component<BoardProps>(props => {
	if ('entities' in props) {
		if (Array.isArray(props.columns)) {
			return <BoardQualifiedStatic {...(props as BoardQualifiedStaticProps)} />
		} else {
			return <BoardQualifiedDynamic {...(props as BoardQualifiedDynamicProps)} />
		}
	} else {
		if (Array.isArray(props.columns)) {
			return <RelativeStaticBoard {...(props as BoardRelativeStaticProps)} />
		} else {
			return <RelativeDynamicBoard {...(props as BoardRelativeDynamicProps)} />
		}
	}
})

export type BoardDynamicColumnsBindingProps = {
	columns: SugaredQualifiedEntityList['entities']
	columnsSortableBy?: string | SugaredRelativeSingleField
	discriminationField: string | SugaredRelativeSingleEntity
}

export type BoardStaticColumnsBindingProps = {
	columns: {
		value: string,
		label: ReactNode
	}[]
	discriminationField: string | SugaredRelativeSingleField
}

export type BoardCommonProps =
	& {
	children: ReactNode
	sortableBy?: string | SugaredRelativeSingleField
	sortScope?: 'column' | 'board'
}

export type BoardQualifiedItemsProps =
	& Pick<SugaredQualifiedEntityList, 'entities' | 'orderBy' | 'limit' | 'offset'>


export type BoardRelativeItemsProps =
	& Pick<SugaredRelativeEntityList, 'field' | 'orderBy' | 'limit' | 'offset'>


export type BoardQualifiedDynamicProps =
	& BoardCommonProps
	& BoardDynamicColumnsBindingProps
	& BoardQualifiedItemsProps

const BoardQualifiedDynamic = Component<BoardQualifiedDynamicProps>(({ entities, orderBy, limit, offset, columns, columnsSortableBy, discriminationField, sortableBy, sortScope, children }) => {
	const itemsAccessor = useEntityListSubTree({ entities, orderBy, limit, offset })
	const columnsAccessor = useEntityListSubTree({ entities: columns })
	const [data, methods] = useDynamicBoard({
		columnEntities: columnsAccessor,
		itemEntities: itemsAccessor,
		columns,
		sortableBy,
		sortScope,
		columnsSortableBy,
		discriminationField,
	})
	return (
		<BoardMethodsContext.Provider value={methods}>
			<BoardColumnsContext.Provider value={data.columns}>
				{children}
			</BoardColumnsContext.Provider>
		</BoardMethodsContext.Provider>
	)
}, ({ entities, orderBy, limit, offset, columns, discriminationField, sortableBy, columnsSortableBy, children }, env) => {

	const columnChildren = boardColumnsAnalyzer.processChildren(children, env)
	const itemChildren = boardItemsAnalyzer.processChildren(children, env)

	return (<>
		<EntityListSubTree entities={entities} orderBy={orderBy} limit={limit} offset={offset}>
			<HasOne {...typeof discriminationField === 'string' ? { field: discriminationField } : discriminationField} />
			{sortableBy && <Field {...typeof sortableBy === 'string' ? { field: sortableBy } : sortableBy} />}
			{itemChildren.map((it, index) => <Fragment key={index}>{it}</Fragment>)}
		</EntityListSubTree>
		<EntityListSubTree entities={columns}>
			{columnsSortableBy && <Field {...typeof columnsSortableBy === 'string' ? { field: columnsSortableBy } : columnsSortableBy} />}
			{columnChildren.map((it, index) => <Fragment key={index}>{it}</Fragment>)}
		</EntityListSubTree>
	</>)
})


export type BoardRelativeDynamicProps =
	& BoardCommonProps
	& BoardDynamicColumnsBindingProps
	& BoardRelativeItemsProps


const RelativeDynamicBoard = Component<BoardRelativeDynamicProps>(({ field, orderBy, limit, offset, columns, columnsSortableBy, discriminationField, sortableBy, sortScope, children }) => {
	const itemsAccessor = useEntityList({ field, orderBy, limit, offset })
	const columnsAccessor = useEntityListSubTree({ entities: columns })
	const [data, methods] = useDynamicBoard({
		columnEntities: columnsAccessor,
		itemEntities: itemsAccessor,
		columns,
		sortableBy,
		sortScope,
		columnsSortableBy,
		discriminationField,
	})
	return (
		<BoardMethodsContext.Provider value={methods}>
			<BoardColumnsContext.Provider value={data.columns}>
				{children}
			</BoardColumnsContext.Provider>
		</BoardMethodsContext.Provider>
	)
}, ({ field, orderBy, limit, offset, columns, discriminationField, sortableBy, columnsSortableBy, children }, env) => {
	const columnChildren = boardColumnsAnalyzer.processChildren(children, env)
	const itemChildren = boardItemsAnalyzer.processChildren(children, env)
	return (<>
		<HasMany field={field} orderBy={orderBy} limit={limit} offset={offset}>
			<HasOne {...typeof discriminationField === 'string' ? { field: discriminationField } : discriminationField} />
			{sortableBy && <Field {...typeof sortableBy === 'string' ? { field: sortableBy } : sortableBy} />}
			{itemChildren.map((it, index) => <Fragment key={index}>{it}</Fragment>)}
		</HasMany>
		<EntityListSubTree entities={columns}>
			{columnsSortableBy && <Field {...typeof columnsSortableBy === 'string' ? { field: columnsSortableBy } : columnsSortableBy} />}
			{columnChildren.map((it, index) => <Fragment key={index}>{it}</Fragment>)}
		</EntityListSubTree>
	</>)
})
export type BoardQualifiedStaticProps =
	& BoardCommonProps
	& BoardStaticColumnsBindingProps
	& BoardQualifiedItemsProps


const BoardQualifiedStatic = Component<BoardQualifiedStaticProps>(({ entities, orderBy, limit, offset, columns, discriminationField, sortableBy, sortScope, children }) => {
	const itemsAccessor = useEntityListSubTree({ entities, orderBy, limit, offset })
	const [data, methods] = useStaticBoard({
		itemEntities: itemsAccessor,
		columns,
		sortableBy,
		sortScope,
		discriminationField,
	})
	return (
		<BoardMethodsContext.Provider value={methods}>
			<BoardColumnsContext.Provider value={data.columns}>
				{children}
			</BoardColumnsContext.Provider>
		</BoardMethodsContext.Provider>
	)
}, ({ entities, orderBy, limit, offset, columns, discriminationField, sortableBy, children }, env) => {
	const itemChildren = boardItemsAnalyzer.processChildren(children, env)
	return (<>
		<EntityListSubTree entities={entities} orderBy={orderBy} limit={limit} offset={offset}>
			<Field {...typeof discriminationField === 'string' ? { field: discriminationField } : discriminationField} />
			{sortableBy && <Field {...typeof sortableBy === 'string' ? { field: sortableBy } : sortableBy} />}
			{itemChildren.map((it, index) => <Fragment key={index}>{it}</Fragment>)}
		</EntityListSubTree>
	</>)
})


export type BoardRelativeStaticProps =
	& BoardCommonProps
	& BoardStaticColumnsBindingProps
	& BoardRelativeItemsProps

const RelativeStaticBoard = Component<BoardRelativeStaticProps>(({ field, orderBy, limit, offset, columns, discriminationField, sortableBy, sortScope, children }) => {
	const itemsAccessor = useEntityList({ field, orderBy, limit, offset })
	const [data, methods] = useStaticBoard({
		itemEntities: itemsAccessor,
		columns,
		sortableBy,
		sortScope,
		discriminationField,
	})
	return (
		<BoardMethodsContext.Provider value={methods}>
			<BoardColumnsContext.Provider value={data.columns}>
				{children}
			</BoardColumnsContext.Provider>
		</BoardMethodsContext.Provider>
	)
}, ({ field, orderBy, limit, offset, columns, discriminationField, sortableBy, children }, env) => {
	const itemChildren = boardItemsAnalyzer.processChildren(children, env)
	return (<>
		<HasMany field={field} orderBy={orderBy} limit={limit} offset={offset}>
			<Field {...typeof discriminationField === 'string' ? { field: discriminationField } : discriminationField} />
			{sortableBy && <Field {...typeof sortableBy === 'string' ? { field: sortableBy } : sortableBy} />}
			{itemChildren.map((it, index) => <Fragment key={index}>{it}</Fragment>)}
		</HasMany>
	</>)
})
