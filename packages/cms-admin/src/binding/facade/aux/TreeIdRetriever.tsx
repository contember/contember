import * as React from 'react'
import { MetaOperationsContext } from '../../coreComponents'
import { MarkerTreeRoot } from '../../dao'

export interface TreeIdRetrieverProps {
	children: (treeId: MarkerTreeRoot.TreeId) => React.ReactElement | null
}

export const TreeIdRetriever = React.memo((props: TreeIdRetrieverProps) => {
	const metaOperations = React.useContext(MetaOperationsContext)
	if (metaOperations) {
		return props.children(metaOperations.treeId)
	}
	return null
})
