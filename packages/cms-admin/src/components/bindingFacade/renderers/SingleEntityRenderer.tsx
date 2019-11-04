import * as React from 'react'
import {
	AccessorContext,
	AccessorTreeStateWithDataContext,
	Component,
	EntityAccessor,
	EntityListAccessor,
	EntityForRemovalAccessor,
} from '../../../binding'

export interface SingleEntityRendererProps {
	children: React.ReactNode
}

export const SingleEntityRenderer = Component<SingleEntityRendererProps>(
	({ children }) => {
		const accessorTreeState = React.useContext(AccessorTreeStateWithDataContext)

		if (accessorTreeState === undefined) {
			return null
		}
		let root: EntityListAccessor | EntityAccessor | EntityForRemovalAccessor | undefined = accessorTreeState.data.root

		if (root instanceof EntityListAccessor) {
			// This can actually legitimately happen when creating ‒ it will be a collection accessor
			root = root.entities[0]
		}

		if (root === undefined || (!(root instanceof EntityAccessor) && !(root instanceof EntityForRemovalAccessor))) {
			return null
		}

		return <AccessorContext.Provider value={root}>{children}</AccessorContext.Provider>
	},
	props => props.children,
	'SingleEntityRenderer',
)
