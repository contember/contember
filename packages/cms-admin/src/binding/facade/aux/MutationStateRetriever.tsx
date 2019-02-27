import * as React from 'react'
import { connect } from 'react-redux'
import State from '../../../state'
import { DataTreeId, DataTreeMutationState } from '../../../state/dataTrees'
import { TreeIdRetriever } from './TreeIdRetriever'

export interface MutationStateRetrieverProps {
	children: (isMutating: DataTreeMutationState) => React.ReactNode
}

class MutationStateRetriever extends React.PureComponent<MutationStateRetrieverProps> {
	public render(): React.ReactNode {
		return (
			<TreeIdRetriever>
				{treeId => <MutationStateRetriever.Inner treeId={treeId} children={this.props.children} />}
			</TreeIdRetriever>
		)
	}
}

namespace MutationStateRetriever {
	export interface InnerOwnProps extends MutationStateRetrieverProps {
		treeId: DataTreeId
	}

	export interface InnerStateProps {
		isMutating: DataTreeMutationState
	}

	export interface InnerDispatchProps {}

	export interface InnerProps extends InnerOwnProps, InnerStateProps, InnerDispatchProps {}

	export class InnerConnected extends React.PureComponent<InnerProps> {
		public render(): React.ReactNode {
			return this.props.children(this.props.isMutating)
		}
	}

	export const Inner = connect<InnerStateProps, InnerDispatchProps, InnerOwnProps, State>(
		({ dataTrees }, ownProps: InnerOwnProps) => {
			const dataTree = dataTrees[ownProps.treeId] || {}
			return {
				isMutating: dataTree.isMutating || false
			}
		}
	)(InnerConnected)
}

export { MutationStateRetriever }
