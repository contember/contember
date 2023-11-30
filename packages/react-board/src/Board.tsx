import { Component, EntityListSubTree, Field, HasMany, HasOne, useEntityList, useEntityListSubTree } from '@contember/react-binding'
import { ComponentType } from 'react'
import { useDynamicBoard } from './useDynamicBoard'
import { useStaticBoard } from './useStaticBoard'
import { BoardBindingProps } from './BoardBindingProps'
import {
	BoardBaseProps,
	BoardQualifiedDynamicProps,
	BoardQualifiedStaticProps,
	BoardRelativeDynamicProps,
	BoardRelativeStaticProps,
} from './types'

export type CreateBoardArgs<T extends {}> = {
	Renderer: ComponentType<BoardBindingProps<any> & T>
	ItemStaticRender?: ComponentType<T>
	ColumnStaticRender?: ComponentType<T>
}

export const createBoard = <RendererExtraProps extends {}>({ Renderer, ItemStaticRender, ColumnStaticRender }: CreateBoardArgs<RendererExtraProps>) => {

	const TopLevelDynamicBoard = Component<BoardQualifiedDynamicProps & RendererExtraProps>(({ entities, orderBy, limit, offset, columns, columnsSortableBy, discriminationField, sortableBy, sortScope, nullColumn, nullColumnPlacement, ...props }) => {
		const itemsAccessor = useEntityListSubTree({ entities, orderBy, limit, offset })
		const columnsAccessor = useEntityListSubTree({ entities: columns })
		const dynamicBoardProps = useDynamicBoard({
			columnEntities: columnsAccessor,
			itemEntities: itemsAccessor,
			columns,
			sortableBy,
			sortScope,
			columnsSortableBy,
			discriminationField,
			nullColumn,
			nullColumnPlacement,
		})
		return (
			<Renderer {...dynamicBoardProps} {...props as RendererExtraProps} />
		)
	}, ({ entities, orderBy, limit, offset, columns, discriminationField, sortableBy, columnsSortableBy, ...props }) => {
		return (<>
			<EntityListSubTree entities={entities} orderBy={orderBy} limit={limit} offset={offset}>
				<HasOne {...typeof discriminationField === 'string' ? { field: discriminationField } : discriminationField} />
				{sortableBy && <Field {...typeof sortableBy === 'string' ? { field: sortableBy } : sortableBy} />}
				{ItemStaticRender && <ItemStaticRender {...props as RendererExtraProps} />}
			</EntityListSubTree>
			<EntityListSubTree entities={columns}>
				{columnsSortableBy && <Field {...typeof columnsSortableBy === 'string' ? { field: columnsSortableBy } : columnsSortableBy} />}
				{ColumnStaticRender && <ColumnStaticRender {...props as RendererExtraProps} />}
			</EntityListSubTree>
		</>)
	})



	const RelativeDynamicBoard = Component<BoardRelativeDynamicProps & RendererExtraProps>(({ field, orderBy, limit, offset, columns, columnsSortableBy, discriminationField, sortableBy, sortScope, nullColumn, nullColumnPlacement, ...props }) => {
		const itemsAccessor = useEntityList({ field, orderBy, limit, offset })
		const columnsAccessor = useEntityListSubTree({ entities: columns })
		const dynamicBoardProps = useDynamicBoard({
			columnEntities: columnsAccessor,
			itemEntities: itemsAccessor,
			columns,
			sortableBy,
			sortScope,
			columnsSortableBy,
			discriminationField,
			nullColumn,
			nullColumnPlacement,
		})
		return (
			<Renderer {...dynamicBoardProps} {...props as RendererExtraProps} />
		)
	}, ({ field, orderBy, limit, offset, columns, discriminationField, sortableBy, columnsSortableBy, ...props }) => {
		return (<>
			<HasMany field={field} orderBy={orderBy} limit={limit} offset={offset}>
				<HasOne {...typeof discriminationField === 'string' ? { field: discriminationField } : discriminationField} />
				{sortableBy && <Field {...typeof sortableBy === 'string' ? { field: sortableBy } : sortableBy} />}
				{ItemStaticRender && <ItemStaticRender {...props as RendererExtraProps} />}
			</HasMany>
			<EntityListSubTree entities={columns}>
				{columnsSortableBy && <Field {...typeof columnsSortableBy === 'string' ? { field: columnsSortableBy } : columnsSortableBy} />}
				{ColumnStaticRender && <ColumnStaticRender {...props as RendererExtraProps} />}
			</EntityListSubTree>
		</>)
	})


	const staticBoardItemInnerRender = ({ discriminationField, sortableBy, ...props }: Pick<BoardQualifiedStaticProps, 'discriminationField' | 'sortableBy'> & RendererExtraProps) => <>
		<Field {...typeof discriminationField === 'string' ? { field: discriminationField } : discriminationField} />
		{sortableBy && <Field {...typeof sortableBy === 'string' ? { field: sortableBy } : sortableBy} />}
		{ItemStaticRender && <ItemStaticRender {...props as unknown as RendererExtraProps} />}
	</>

	const TopLevelStaticBoard = Component<BoardQualifiedStaticProps & RendererExtraProps>(({ entities, orderBy, limit, offset, columns, discriminationField, sortableBy, sortScope, nullColumn, nullColumnPlacement, ...props }) => {
		const itemsAccessor = useEntityListSubTree({ entities, orderBy, limit, offset })
		const staticBoardProps = useStaticBoard({
			itemEntities: itemsAccessor,
			columns,
			sortableBy,
			sortScope,
			discriminationField,
			nullColumn,
			nullColumnPlacement,
		})
		return (
			<Renderer {...staticBoardProps} {...props as RendererExtraProps} />
		)
	}, ({ entities, orderBy, limit, offset, columns, discriminationField, sortableBy, ...props }) => {
		return (<>
			<EntityListSubTree entities={entities} orderBy={orderBy} limit={limit} offset={offset}>
				{staticBoardItemInnerRender({ sortableBy, discriminationField, ...(props as RendererExtraProps) })}
			</EntityListSubTree>
		</>)
	})


	const RelativeStaticBoard = Component<BoardRelativeStaticProps & RendererExtraProps>(({ field, orderBy, limit, offset, columns, discriminationField, sortableBy, sortScope, nullColumn, nullColumnPlacement, ...props }) => {
		const itemsAccessor = useEntityList({ field, orderBy, limit, offset })
		const staticBoardProps = useStaticBoard({
			itemEntities: itemsAccessor,
			columns,
			sortableBy,
			sortScope,
			discriminationField,
			nullColumn,
			nullColumnPlacement,
		})
		return (
			<Renderer {...staticBoardProps} {...props as RendererExtraProps} />
		)
	}, ({ field, orderBy, limit, offset, columns, discriminationField, sortableBy, ...props }) => {
		return (<>
			<HasMany field={field} orderBy={orderBy} limit={limit} offset={offset}>
				{staticBoardItemInnerRender({ sortableBy, discriminationField, ...(props as RendererExtraProps) })}
			</HasMany>
		</>)
	})



	return Component<BoardBaseProps<RendererExtraProps>>(props => {
		if ('entities' in props) {
			if (Array.isArray(props.columns)) {
				return <TopLevelStaticBoard {...(props as BoardQualifiedStaticProps & RendererExtraProps)} />
			} else {
				return <TopLevelDynamicBoard {...(props as BoardQualifiedDynamicProps & RendererExtraProps)} />
			}
		} else {
			if (Array.isArray(props.columns)) {
				return <RelativeStaticBoard {...(props as BoardRelativeStaticProps & RendererExtraProps)} />
			} else {
				return <RelativeDynamicBoard {...(props as BoardRelativeDynamicProps & RendererExtraProps)} />
			}
		}
	})

}
