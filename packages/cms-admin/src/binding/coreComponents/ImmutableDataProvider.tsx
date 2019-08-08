import * as React from 'react'
import { DataRendererProps } from './DataProvider'

interface ImmutableDataProviderProps {
	immutable: boolean
	children: (
		data: DataRendererProps['data'],
		onDataAvailable: (data: DataRendererProps['data']) => void,
	) => React.ReactNode
}

interface ImmutableDataProviderState {
	data: DataRendererProps['data']
}

export class ImmutableDataProvider extends React.PureComponent<ImmutableDataProviderProps, ImmutableDataProviderState> {
	state = {
		data: undefined,
	}

	public render() {
		return this.props.children(this.state.data, data => {
			if (!this.state.data || !this.props.immutable) {
				this.setState({
					data: data,
				})
			}
		})
	}
}
