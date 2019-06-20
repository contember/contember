import * as React from 'react'
import { connect } from 'react-redux'
import { sendContentAPIRequest } from '../../actions/content'
import { setDataTreeDirtiness, setDataTreeMutationState } from '../../actions/dataTrees'
import { Dispatch } from '../../actions/types'
import State from '../../state'
import { ContentRequestsState, ContentStatus } from '../../state/content'
import { DataTreeDirtinessState, DataTreeId, DataTreeMutationState } from '../../state/dataTrees'
import { AccessorTreeRoot, MarkerTreeRoot, MetaOperationsAccessor } from '../dao'
import { DefaultRenderer } from '../facade/renderers'
import { AccessorTreeGenerator, MutationGenerator, QueryGenerator } from '../model'
import { MetaOperationsContext, MetaOperationsContextValue } from './MetaOperationsContext'
import { DirtinessContext, MutationStateContext } from './PersistState'

export interface DataRendererProps {
	data?: AccessorTreeRoot | undefined
}

export interface DataProviderOwnProps<DRP> {
	markerTree: MarkerTreeRoot
	renderer?: React.ComponentClass<DRP & DataRendererProps>
	rendererProps?: DRP
	onDataAvailable?: (data: DataRendererProps['data']) => void
}

export interface DataProviderDispatchProps {
	setDataTreeDirtiness: (dataTreeId: DataTreeId, isDirty: DataTreeDirtinessState) => void
	setDataTreeMutationState: (dataTreeId: DataTreeId, isMutating: DataTreeMutationState) => void
	sendContentAPIRequest: (query: string) => Promise<string>
}

export interface DataProviderStateProps {
	requests: ContentRequestsState
	isMutating: boolean
	isDirty: boolean
}

type DataProviderInnerProps<DRP> = DataProviderOwnProps<DRP> & DataProviderDispatchProps & DataProviderStateProps

export interface DataProviderState {
	accessorTree?: AccessorTreeRoot
	query?: string
	queryRequestId?: string
	mutationRequestId?: string
}

class DataProvider<DRP> extends React.PureComponent<DataProviderInnerProps<DRP>, DataProviderState, boolean> {
	public state: DataProviderState = {
		accessorTree: undefined,
		query: undefined,
		queryRequestId: undefined,
		mutationRequestId: undefined
	}

	protected triggerPersist = (): Promise<void> => {
		const persistedData = this.state.queryRequestId ? this.props.requests[this.state.queryRequestId].data : undefined
		const successfullyFinalizeMutation: () => Promise<void> = () => {
			this.props.setDataTreeDirtiness(this.props.markerTree.id, false)
			return Promise.resolve()
		}

		if (!this.state.accessorTree) {
			return Promise.reject()
		}

		const generator = new MutationGenerator(persistedData, this.state.accessorTree, this.props.markerTree)
		const mutation = generator.getPersistMutation()

		console.log('mutation', mutation)
		if (mutation === undefined) {
			return successfullyFinalizeMutation()
		}

		this.props.setDataTreeMutationState(this.props.markerTree.id, true)
		return this.props
			.sendContentAPIRequest(mutation)
			.then(async () => {
				if (!this.state.query) {
					return successfullyFinalizeMutation()
				}
				const queryRequestId = await this.props.sendContentAPIRequest(this.state.query)
				if (!this.unmounted) {
					this.setState({ queryRequestId })
				}
				return successfullyFinalizeMutation()
			})
			.finally(() => {
				this.props.setDataTreeMutationState(this.props.markerTree.id, false)
			})
	}

	protected metaOperations: MetaOperationsContextValue = new MetaOperationsAccessor(
		this.props.markerTree.id,
		this.triggerPersist
	)

	componentDidUpdate(prevProps: DataProviderInnerProps<DRP>, prevState: DataProviderState) {
		if (!this.state.queryRequestId) {
			return
		}
		const prevReq = prevProps.requests[this.state.queryRequestId]
		const req = this.props.requests[this.state.queryRequestId]
		if (
			req.state === ContentStatus.LOADED &&
			((prevReq.state !== req.state && req.data !== prevReq.data) ||
				this.state.queryRequestId !== prevState.queryRequestId)
		) {
			this.initializeAccessorTree(req.data)
		}

		if (
			req.state === ContentStatus.LOADED &&
			this.state.accessorTree &&
			prevState.accessorTree &&
			this.state.accessorTree !== prevState.accessorTree &&
			this.state.queryRequestId === prevState.queryRequestId &&
			!this.props.isDirty
		) {
			this.props.setDataTreeDirtiness(this.props.markerTree.id, true)
		}
	}

	private renderRenderer() {
		if (this.props.renderer) {
			const Renderer = this.props.renderer
			if (this.props.rendererProps === undefined) {
				throw new Error(`No rendererProps passed to custom renderer.`)
			}
			return (
				<Renderer {...this.props.rendererProps} data={this.state.accessorTree}>
					{this.props.children}
				</Renderer>
			)
		} else {
			return (
				<DefaultRenderer {...this.props.rendererProps} data={this.state.accessorTree}>
					{this.props.children}
				</DefaultRenderer>
			)
		}
	}

	public render() {
		return (
			<MetaOperationsContext.Provider value={this.metaOperations}>
				<DirtinessContext.Provider value={this.props.isDirty}>
					<MutationStateContext.Provider value={this.props.isMutating}>
						{this.renderRenderer()}
					</MutationStateContext.Provider>
				</DirtinessContext.Provider>
			</MetaOperationsContext.Provider>
		)
	}

	protected unmounted: boolean = false

	public async componentDidMount() {
		console.log('The structure is', this.props.markerTree)

		const query = new QueryGenerator(this.props.markerTree).getReadQuery()

		console.log('query', query)
		if (query) {
			const queryRequestId = await this.props.sendContentAPIRequest(query)
			if (!this.unmounted) {
				this.setState({ queryRequestId, query })
			}
		} else {
			this.initializeAccessorTree(undefined)
		}
	}

	public componentWillUnmount() {
		this.unmounted = true
	}

	private initializeAccessorTree(initialData: any) {
		const accessTreeGenerator = new AccessorTreeGenerator(this.props.markerTree, initialData)
		accessTreeGenerator.generateLiveTree(accessorTree => {
			console.log('data', accessorTree)
			this.props.onDataAvailable && this.props.onDataAvailable(accessorTree)
			this.setState({ accessorTree })
		})
	}
}

const getDataProvider = <DRP extends {}>() =>
	connect<DataProviderStateProps, DataProviderDispatchProps, DataProviderOwnProps<DRP>, State>(
		({ content, dataTrees }, ownProps: DataProviderOwnProps<DRP>) => {
			const dataTree = dataTrees[ownProps.markerTree.id] || {}
			return {
				requests: content.requests,
				isDirty: dataTree.isDirty || false,
				isMutating: dataTree.isMutating || false
			}
		},
		(dispatch: Dispatch) => ({
			setDataTreeDirtiness: (dataTreeId: DataTreeId, isDirty: DataTreeDirtinessState) =>
				dispatch(setDataTreeDirtiness(dataTreeId, isDirty)),
			setDataTreeMutationState: (dataTreeId: DataTreeId, isMutating: DataTreeMutationState) =>
				dispatch(setDataTreeMutationState(dataTreeId, isMutating)),
			sendContentAPIRequest: (query: string) => dispatch(sendContentAPIRequest(query))
		})
	)(DataProvider as new (props: DataProviderInnerProps<DRP>) => DataProvider<DRP>)

export { getDataProvider }
