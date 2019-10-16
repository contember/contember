import * as React from 'react'
import {
	AccessorContext,
	AccessorTreeStateWithDataContext,
	Component,
	EntityCollectionAccessor,
} from '../../../binding'

export interface ImmutableEntityCollectionRendererProps {
	beforeContent?: React.ReactNode
	afterContent?: React.ReactNode
	children: React.ReactNode
}

export const ImmutableEntityCollectionRenderer = Component<ImmutableEntityCollectionRendererProps>(
	({ beforeContent, afterContent, children }) => {
		const accessorTreeState = React.useContext(AccessorTreeStateWithDataContext)

		if (accessorTreeState === undefined) {
			return null
		}
		const root = accessorTreeState.data.root

		if (!(root instanceof EntityCollectionAccessor)) {
			return null
		}

		return (
			<>
				{beforeContent}
				{root.entities.map(entity => {
					if (entity === undefined) {
						return null
					}
					return (
						<AccessorContext.Provider value={entity} key={entity.getKey()}>
							{children}
						</AccessorContext.Provider>
					)
				})}
				{afterContent}
			</>
		)
	},
	props => (
		<>
			{props.beforeContent}
			{props.children}
			{props.afterContent}
		</>
	),
	'EntityCollectionRenderer',
)
