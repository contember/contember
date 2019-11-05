import { Box, Message } from '@contember/ui'
import * as React from 'react'
import { AccessorContext, AccessorTreeStateWithDataContext, Component, EntityListAccessor } from '../../../binding'
import { Repeater } from '../collections'

export interface EntityListWrapperProps {
	accessor: EntityListAccessor
	isEmpty: boolean
	originalChildren: React.ReactNode
	children: React.ReactNode
}

export interface ImmutableEntityListRendererProps {
	beforeContent?: React.ReactNode
	afterContent?: React.ReactNode
	emptyMessage?: React.ReactNode
	wrapperComponent?: React.ComponentType<EntityListWrapperProps>
	children: React.ReactNode
}

export const ImmutableEntityListRenderer = Component<ImmutableEntityListRendererProps>(
	({
		beforeContent,
		afterContent,
		emptyMessage = 'There is no data at the moment.',
		wrapperComponent: Wrapper,
		children,
	}) => {
		const accessorTreeState = React.useContext(AccessorTreeStateWithDataContext)

		if (accessorTreeState === undefined) {
			return null
		}
		const root = accessorTreeState.data.root

		if (!(root instanceof EntityListAccessor)) {
			return null
		}

		const entities = root.getFilteredEntities()
		const isEmpty = !entities.length

		const content = (
			<>
				{isEmpty ||
					entities.map(entity => (
						<AccessorContext.Provider value={entity} key={entity.getKey()}>
							{children}
						</AccessorContext.Provider>
					))}
				{isEmpty && (
					<Box>
						<Message flow="generousBlock">{emptyMessage}</Message>
					</Box>
				)}
			</>
		)

		return (
			<>
				{beforeContent}
				{!!Wrapper && (
					<Wrapper isEmpty={isEmpty} accessor={root} originalChildren={children}>
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
	'ImmutableEntityListRenderer',
)
