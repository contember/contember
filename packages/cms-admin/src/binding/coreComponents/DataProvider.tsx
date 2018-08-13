import * as React from 'react'
import RootEntityMarker from '../dao/RootEntityMarker'
import { AccessorTreeGenerator, EntityTreeToQueryConverter } from '../model'
import PersistQueryGenerator from '../model/PersistQueryGenerator'
import DataContext, { DataContextValue } from './DataContext'
import FieldContext from './FieldContext'
import { connect } from 'react-redux'
import State from '../../state'
import { ContentStatus } from '../../state/content'
import { getData } from '../../actions/content'
import { Dispatch } from '../../actions/types'

export interface DataProviderProps {
	children: (persist: () => void) => React.ReactNode
}
export interface DataProviderDispatchProps {
	getData: (query: string) => void
}
export interface DataProviderStateProps {
	data: any
	ready: boolean
}
type DataProviderInnerProps = DataProviderProps & DataProviderDispatchProps & DataProviderStateProps

export interface DataProviderState {
	data?: DataContextValue
}

class DataProvider extends React.Component<DataProviderInnerProps, DataProviderState, boolean> {
	public state: DataProviderState = {
		data: undefined
	}

	protected rootContext?: RootEntityMarker = new RootEntityMarker()

	componentDidUpdate(prevProps: DataProviderInnerProps) {
		if (!this.rootContext) return
		if (prevProps.ready !== this.props.ready && this.props.data !== prevProps.data) {
			const accessTreeGenerator = new AccessorTreeGenerator(this.rootContext, this.props.data)
			accessTreeGenerator.generateLiveTree(newData => this.setState({ data: newData }))
		}
	}

	protected persistedData?: object

	protected triggerPersist = () => {
		if (this.persistedData && this.rootContext) {
			const generator = new PersistQueryGenerator(this.persistedData, this.rootContext)

			console.log(generator.generatePersistQuery())
		}
	}

	public render() {
		return (
			<FieldContext.Provider value={this.rootContext}>
				<DataContext.Provider value={this.state.data}>{this.props.children(this.triggerPersist)}</DataContext.Provider>
			</FieldContext.Provider>
		)
	}

	public componentDidMount() {
		console.log('The structure is', this.rootContext!.content)

		if (this.rootContext === undefined) {
			return
		}

		const converter = new EntityTreeToQueryConverter(this.rootContext)
		const query = converter.convert()
		if (query) {
			this.props.getData(query)
		}
	}
}

export default connect<DataProviderStateProps, DataProviderDispatchProps, DataProviderProps, State>(
	({ content }) => ({
		data: content.data,
		ready: content.state === ContentStatus.LOADED
	}),
	(dispatch: Dispatch) => ({
		getData: (query: string) => dispatch(getData('blog', 'prod', query))
	})
)(DataProvider)
