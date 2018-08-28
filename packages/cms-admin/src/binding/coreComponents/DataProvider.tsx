import * as React from 'react'
import { connect } from 'react-redux'
import { getData, putData } from '../../actions/content'
import { Dispatch } from '../../actions/types'
import State from '../../state'
import { ContentStatus } from '../../state/content'
import EntityAccessor from '../dao/EntityAccessor'
import RootEntityMarker from '../dao/RootEntityMarker'
import { AccessorTreeGenerator, EntityTreeToQueryConverter } from '../model'
import EntityTreeGenerator from '../model/EntityTreeGenerator'
import PersistQueryGenerator from '../model/PersistQueryGenerator'
import DataContext, { DataContextValue } from './DataContext'

export interface DataProviderProps {
	//children: (persist: () => void) => React.ReactNode
}
export interface DataProviderDispatchProps {
	getData: (query: string) => void
	putData: (query: string) => Promise<void>
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

	protected entityTree?: RootEntityMarker = new RootEntityMarker()

	componentDidUpdate(prevProps: DataProviderInnerProps) {
		if (!this.entityTree) {
			return
		}
		if (this.props.ready && prevProps.ready !== this.props.ready && this.props.data !== prevProps.data) {
			const accessTreeGenerator = new AccessorTreeGenerator(this.entityTree, this.props.data)
			accessTreeGenerator.generateLiveTree(newData => this.setState({ data: newData }))
		}
	}

	protected triggerPersist = () => {
		if (this.props.data && this.state.data instanceof EntityAccessor) {
			const generator = new PersistQueryGenerator(this.props.data, this.state.data)
			const query = generator.generatePersistQuery()

			if (query) {
				this.props.putData(query)
			}
		}
	}

	public render() {
		return this.state.data ? (
			<DataContext.Provider value={this.state.data}>{this.props.children}</DataContext.Provider>
		) : (
			null
		)
	}

	public componentDidMount() {
		const generator = new EntityTreeGenerator(this.props.children)

		this.entityTree = generator.generate()

		console.log('The structure is', this.entityTree!.content)

		const converter = new EntityTreeToQueryConverter(this.entityTree)
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
		getData: (query: string) => dispatch(getData('blog', 'prod', query)),
		putData: (query: string) => dispatch(putData('blog', 'prod', query))
	})
)(DataProvider)
