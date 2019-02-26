import * as React from 'react'
import { DataRendererProps } from '../../coreComponents'
import { TreeIdRetriever } from '../aux'
import { LoadingSpinner, PersistInfo, PersistInfoPublicProps } from './userFeedback'

export interface FeedbackRendererPublicProps extends DataRendererProps {
	loadingFallback?: React.ReactNode
	userFeedback?: PersistInfoPublicProps
}

export interface FeedbackRendererInternalProps {
	children: (data: Exclude<DataRendererProps['data'], undefined>) => React.ReactNode
}

export interface FeedbackRendererProps extends FeedbackRendererPublicProps, FeedbackRendererInternalProps {}

export class FeedbackRenderer extends React.PureComponent<FeedbackRendererProps> {
	public render(): React.ReactNode {
		const data = this.props.data

		if (!data) {
			if (this.props.loadingFallback) {
				return this.props.loadingFallback
			}
			return <LoadingSpinner />
		}

		return (
			<TreeIdRetriever>
				{treeId => (
					<>
						{<PersistInfo {...this.props.userFeedback || {}} treeId={treeId} />}
						{this.props.children(data)}
					</>
				)}
			</TreeIdRetriever>
		)
	}
}
