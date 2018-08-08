import * as React from 'react'
import DataContext, { DataContextValue } from './DataContext'
import FieldContext, { FieldContextValue } from './FieldContext'

export interface DataProviderProps {}

export interface DataProviderState {
	data?: DataContextValue
}

export default class DataProvider extends React.Component<DataProviderProps, DataProviderState> {
	public state: DataProviderState = {
		data: undefined
	}

	protected rootContext?: FieldContextValue

	public render() {
		this.rootContext = {}

		return (
			<FieldContext.Provider value={this.rootContext}>
				<DataContext.Provider value={this.state.data}>{this.props.children}</DataContext.Provider>
			</FieldContext.Provider>
		)
	}

	public componentDidMount() {
		console.log('The structure is', this.rootContext)
	}
}
