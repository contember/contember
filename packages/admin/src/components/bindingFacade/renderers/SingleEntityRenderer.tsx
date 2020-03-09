import * as React from 'react'
import {
	AccessorContext,
	AccessorTreeStateWithDataContext,
	Component,
	EntityAccessor,
	EntityForRemovalAccessor,
	EntityListAccessor,
	RootAccessor,
} from '@contember/binding'

export interface SingleEntityRendererProps {
	children: React.ReactNode
}

export const SingleEntityRenderer = Component<SingleEntityRendererProps>(
	({ children }) => {
		const accessorTreeState = React.useContext(AccessorTreeStateWithDataContext)

		if (accessorTreeState === undefined) {
			return null
		}
		let root: RootAccessor | undefined = accessorTreeState.data

		if (root instanceof EntityListAccessor) {
			// This can actually legitimately happen when creating ‒ it will be a list accessor
			root = Array.from(root)[0]
		}

		if (root === undefined || (!(root instanceof EntityAccessor) && !(root instanceof EntityForRemovalAccessor))) {
			return null
		}

		return <AccessorContext.Provider value={root}>{children}</AccessorContext.Provider>
	},
	props => props.children,
	'SingleEntityRenderer',
)
