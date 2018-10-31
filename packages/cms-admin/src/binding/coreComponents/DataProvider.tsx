import * as React from 'react'
import { connect } from 'react-redux'
import { getData, putData } from '../../actions/content'
import { Dispatch } from '../../actions/types'
import State from '../../state'
import { ContentRequestsState, ContentStatus } from '../../state/content'
import AccessorTreeRoot from '../dao/AccessorTreeRoot'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'
import MetaOperationsAccessor from '../dao/MetaOperationsAccessor'
import { DefaultRenderer } from '../facade/renderers'
import AccessorTreeGenerator from '../model/AccessorTreeGenerator'
import MutationGenerator from '../model/MutationGenerator'
import QueryGenerator from '../model/QueryGenerator'
import MetaOperationsContext, { MetaOperationsContextValue } from './MetaOperationsContext'

export interface DataRendererProps {
	data: AccessorTreeRoot | undefined
}

export interface DataProviderOwnProps {
	markerTree: MarkerTreeRoot
	renderer?: React.ComponentClass<DataRendererProps>
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
	data?: AccessorTreeRoot
	id?: string
}

class DataProvider extends React.Component<DataProviderInnerProps, DataProviderState, boolean> {
	public state: DataProviderState = {
		data: undefined
	}

	protected triggerPersist = () => {
		const data = this.state.id ? this.props.requests[this.state.id].data : undefined

		if (this.state.data) {
			const generator = new MutationGenerator(data, this.state.data, this.props.markerTree)
			const mutation = generator.getPersistMutation()

			console.log('mutation', mutation)
			if (mutation !== undefined) {
				this.props.putData(mutation)
			}
		}
	}

	protected metaOperations: MetaOperationsContextValue = new MetaOperationsAccessor(this.triggerPersist)

	componentDidUpdate(prevProps: DataProviderInnerProps, prevState: DataProviderState) {
		if (!this.state.id) {
			return
		}
		const prevReq = prevProps.requests[this.state.id]
		const req = this.props.requests[this.state.id]
		if (
			req.state === ContentStatus.LOADED &&
			((prevReq.state !== req.state && req.data !== prevReq.data) || this.state.id !== prevState.id)
		) {
			const accessTreeGenerator = new AccessorTreeGenerator(this.props.markerTree, req.data)
			accessTreeGenerator.generateLiveTree(newData => {
				console.log('data', newData)
				this.setState({ data: newData })
			})
		}
	}

	public render() {
		const Renderer = this.props.renderer || DefaultRenderer

		return (
			<MetaOperationsContext.Provider value={this.metaOperations}>
				<Renderer data={this.state.data}>{this.props.children}</Renderer>
			</MetaOperationsContext.Provider>
		)
	}

	protected unmounted: boolean = false

	public async componentDidMount() {
		console.log('The structure is', this.props.markerTree)

		const query = new QueryGenerator(this.props.markerTree).getReadQuery()

		console.log('query', query)
		if (query) {
			const id = await this.props.getData(query)
			if (!this.unmounted) {
				this.setState({ id })
			}
		} else {
			const accessTreeGenerator = new AccessorTreeGenerator(this.props.markerTree, undefined)
			accessTreeGenerator.generateLiveTree(newData => this.setState({ data: newData }))
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
		getData: (query: string) => dispatch(getData(query)),
		putData: (query: string) => dispatch(putData(query))
	})
)(DataProvider)
