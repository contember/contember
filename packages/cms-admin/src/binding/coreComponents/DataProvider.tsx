import * as React from 'react'
import { connect } from 'react-redux'
import { getData, putData } from '../../actions/content'
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
	getData: (query: string) => Promise<string>
	putData: (query: string) => Promise<void>
}

export interface DataProviderStateProps {
	requests: ContentRequestsState
	isMutating: boolean
	isDirty: boolean
}

type DataProviderInnerProps<DRP> = DataProviderOwnProps<DRP> & DataProviderDispatchProps & DataProviderStateProps

export interface DataProviderState {
	data?: AccessorTreeRoot
	query?: string
	id?: string
}

class DataProvider<DRP> extends React.PureComponent<DataProviderInnerProps<DRP>, DataProviderState, boolean> {
	public state: DataProviderState = {
		query: undefined,
		data: undefined
	}

	protected triggerPersist = (): Promise<void> => {
		const data = this.state.id ? this.props.requests[this.state.id].data : undefined
		const successfullyFinalizeMutation: () => Promise<void> = () => {
			this.props.setDataTreeDirtiness(this.props.markerTree.id, false)
			return Promise.resolve()
		}

		if (this.state.data) {
			const generator = new MutationGenerator(data, this.state.data, this.props.markerTree)
			const mutation = generator.getPersistMutation()

			console.log('mutation', mutation)
			if (mutation === undefined) {
				return successfullyFinalizeMutation()
			}

			this.props.setDataTreeMutationState(this.props.markerTree.id, true)
			return this.props
				.putData(mutation)
				.then(async () => {
					if (!this.state.query) {
						return successfullyFinalizeMutation()
					}
					const id = await this.props.getData(this.state.query)
					if (!this.unmounted) {
						this.setState({ id })
					}
					return successfullyFinalizeMutation()
				})
				.finally(() => {
					this.props.setDataTreeMutationState(this.props.markerTree.id, false)
				})
		}
		return Promise.reject()
	}

	protected metaOperations: MetaOperationsContextValue = new MetaOperationsAccessor(
		this.props.markerTree.id,
		this.triggerPersist
	)

	componentDidUpdate(prevProps: DataProviderInnerProps<DRP>, prevState: DataProviderState) {
		if (!this.state.id) {
			return
		}
		const prevReq = prevProps.requests[this.state.id]
		const req = this.props.requests[this.state.id]
		if (
			req.state === ContentStatus.LOADED &&
			((prevReq.state !== req.state && req.data !== prevReq.data) || this.state.id !== prevState.id)
		) {
			this.initializeAccessorTree(req.data)
		}

		if (
			req.state === ContentStatus.LOADED &&
			this.state.data &&
			prevState.data &&
			this.state.data !== prevState.data &&
			this.state.id === prevState.id &&
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
				<Renderer {...this.props.rendererProps} data={this.state.data}>
					{this.props.children}
				</Renderer>
			)
		} else {
			return (
				<DefaultRenderer {...this.props.rendererProps} data={this.state.data}>
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
			const id = await this.props.getData(query)
			if (!this.unmounted) {
				this.setState({ id, query })
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
		accessTreeGenerator.generateLiveTree(newData => {
			console.log('data', newData)
			this.props.onDataAvailable && this.props.onDataAvailable(newData)
			this.setState({ data: newData })
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
			getData: (query: string) => dispatch(getData(query)),
			putData: (query: string) => dispatch(putData(query))
		})
	)(DataProvider as new (props: DataProviderInnerProps<DRP>) => DataProvider<DRP>)

export { getDataProvider }
