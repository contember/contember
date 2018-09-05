import * as React from 'react'
import { connect } from 'react-redux'
import { getData, putData } from '../../actions/content'
import { Dispatch } from '../../actions/types'
import State from '../../state'
import { ContentRequestsState, ContentStatus } from '../../state/content'
import EntityAccessor from '../dao/EntityAccessor'
import EntityMarker from '../dao/EntityMarker'
import MetaOperationsAccessor from '../dao/MetaOperationsAccessor'
import { AccessorTreeGenerator } from '../model'
import EntityTreeGenerator from '../model/EntityTreeGenerator'
import PersistQueryGenerator from '../model/PersistQueryGenerator'
import DataContext, { DataContextValue } from './DataContext'
import MetaOperationsContext, { MetaOperationsContextValue } from './MetaOperationsContext'

export interface DataProviderOwnProps {
	generateReadQuery: (rootMarker?: EntityMarker) => string | undefined
}

export interface DataProviderDispatchProps {
	getData: (query: string) => Promise<string>
	putData: (query: string) => Promise<void>
}
export interface DataProviderStateProps {
	requests: ContentRequestsState
}
type DataProviderInnerProps = DataProviderOwnProps & DataProviderDispatchProps & DataProviderStateProps

export interface DataProviderState {
	data?: DataContextValue
	id?: string
}

class DataProvider extends React.Component<DataProviderInnerProps, DataProviderState, boolean> {
	public state: DataProviderState = {
		data: undefined
	}

	protected entityTree?: EntityMarker

	protected triggerPersist = () => {
		if (!this.state.id) {
			return
		}
		const data = this.props.requests[this.state.id].data
		if (data && this.state.data instanceof EntityAccessor) {
			const generator = new PersistQueryGenerator(data, this.state.data)
			const query = generator.generatePersistQuery()

			if (query) {
				this.props.putData(query)
			}
		}
	}

	protected metaOperations: MetaOperationsContextValue = new MetaOperationsAccessor(this.triggerPersist)

	componentDidUpdate(prevProps: DataProviderInnerProps, prevState: DataProviderState) {
		if (!this.entityTree || !this.state.id) {
			return
		}
		const prevReq = prevProps.requests[this.state.id]
		const req = this.props.requests[this.state.id]
		if (
			req.state === ContentStatus.LOADED &&
			((prevReq.state !== req.state && req.data !== prevReq.data) || this.state.id !== prevState.id)
		) {
			const accessTreeGenerator = new AccessorTreeGenerator(this.entityTree, req.data)
			accessTreeGenerator.generateLiveTree(newData => this.setState({ data: newData }))
		}
	}

	public render() {
		return this.state.data ? (
			<MetaOperationsContext.Provider value={this.metaOperations}>
				<DataContext.Provider value={this.state.data}>{this.props.children}</DataContext.Provider>
			</MetaOperationsContext.Provider>
		) : null
	}

	protected unmounted: boolean = false

	public async componentDidMount() {
		const generator = new EntityTreeGenerator(this.props.children)

		this.entityTree = generator.generate()

		console.log('The structure is', this.entityTree!)

		const query = this.props.generateReadQuery(this.entityTree)

		if (query) {
			const id = await this.props.getData(query)
			if (!this.unmounted) this.setState({ id })
		}
	}

	public componentWillUnmount() {
		this.unmounted = true
	}
}

export default connect<DataProviderStateProps, DataProviderDispatchProps, DataProviderOwnProps, State>(
	({ content }) => ({
		requests: content.requests
	}),
	(dispatch: Dispatch) => ({
		getData: (query: string) => dispatch(getData('blog', 'prod', query)),
		putData: (query: string) => dispatch(putData('blog', 'prod', query))
	})
)(DataProvider)
