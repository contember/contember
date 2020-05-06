import * as React from 'react'
import {
	AccessorProvider,
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

		return <AccessorProvider value={root}>{children}</AccessorProvider>
	},
	props => props.children,
	'SingleEntityRenderer',
)
