import * as React from 'react'
import { DataRendererProps } from '../../coreComponents'
import { LoadingSpinner } from './userFeedback'

export interface LoadingRendererPublicProps extends DataRendererProps {
	fallback?: React.ReactNode
}

export interface LoadingRendererInternalProps {
	children: (data: Exclude<DataRendererProps['data'], undefined>) => React.ReactNode
}

export interface LoadingRendererProps extends LoadingRendererPublicProps, LoadingRendererInternalProps {}

export class LoadingRenderer extends React.PureComponent<LoadingRendererProps> {
	public render(): React.ReactNode {
		const data = this.props.data

		if (!data) {
			if (this.props.fallback) {
				return this.props.fallback
			}
			return <LoadingSpinner />
		}

		return this.props.children(data)
	}
}
