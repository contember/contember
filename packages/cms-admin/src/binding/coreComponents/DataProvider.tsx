import * as React from 'react'
import RootEntityMarker from '../dao/RootEntityMarker'
import TreeToQueryConverter from '../model/TreeToQueryConverter'
import DataContext, { DataContextValue } from './DataContext'
import FieldContext from './FieldContext'

export interface DataProviderProps {}

export interface DataProviderState {
	data?: DataContextValue
}

export default class DataProvider extends React.Component<DataProviderProps, DataProviderState> {
	public state: DataProviderState = {
		data: undefined
	}

	protected rootContext?: RootEntityMarker

	public render() {
		this.rootContext = new RootEntityMarker()

		return (
			<FieldContext.Provider value={this.rootContext}>
				<DataContext.Provider value={this.state.data}>{this.props.children}</DataContext.Provider>
			</FieldContext.Provider>
		)
	}

	public componentDidMount() {
		console.log('The structure is', this.rootContext!.content)

		if (this.rootContext === undefined) {
			return
		}

		const converter = new TreeToQueryConverter(this.rootContext)

		console.log(converter.convert())

	}
}
