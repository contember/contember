import * as React from 'react'
import { MetaOperationsContext, MetaOperationsContextValue } from '../../coreComponents'
import { MarkerTreeRoot } from '../../dao'

export interface TreeIdRetrieverProps {
	children: (treeId: MarkerTreeRoot.TreeId) => React.ReactNode
}

export class TreeIdRetriever extends React.PureComponent<TreeIdRetrieverProps> {
	public render(): React.ReactNode {
		return (
			<MetaOperationsContext.Consumer>
				{(metaOperations: MetaOperationsContextValue) =>
					metaOperations && this.props.children(metaOperations.treeId)
				}
			</MetaOperationsContext.Consumer>
		)
	}
}
