import * as React from 'react'
import {
	AccessorContext,
	AccessorTreeStateWithDataContext,
	Component,
	EntityCollectionAccessor,
} from '../../../binding'
import { Repeater } from '../collections'

export interface ImmutableEntityCollectionWrapperProps {
	accessor: EntityCollectionAccessor
	isEmpty: boolean
	children: React.ReactNode
}

export interface ImmutableEntityCollectionRendererProps {
	beforeContent?: React.ReactNode
	afterContent?: React.ReactNode
	emptyMessage?: React.ReactNode
	wrapperComponent?: React.ComponentType<ImmutableEntityCollectionWrapperProps>
	children: React.ReactNode
}

export const ImmutableEntityCollectionRenderer = Component<ImmutableEntityCollectionRendererProps>(
	({ beforeContent, afterContent, emptyMessage, wrapperComponent: Wrapper, children }) => {
		const accessorTreeState = React.useContext(AccessorTreeStateWithDataContext)

		if (accessorTreeState === undefined) {
			return null
		}
		const root = accessorTreeState.data.root

		if (!(root instanceof EntityCollectionAccessor)) {
			return null
		}

		const entities = Repeater.filterEntities(root)
		const isEmpty = !entities.length

		const content = (
			<>
				{isEmpty ||
					entities.map(entity => (
						<AccessorContext.Provider value={entity} key={entity.getKey()}>
							{children}
						</AccessorContext.Provider>
					))}
				{isEmpty && emptyMessage}
			</>
		)

		return (
			<>
				{beforeContent}
				{!!Wrapper && (
					<Wrapper isEmpty={isEmpty} accessor={root}>
						{content}
					</Wrapper>
				)}
				{!!Wrapper || content}
				{afterContent}
			</>
		)
	},
	props => (
		// Deliberately omitting emptyMessage ‒ it's not supposed to be data-dependent.
		<>
			{props.beforeContent}
			{props.children}
			{props.afterContent}
		</>
	),
	'ImmutableEntityCollectionRenderer',
)
