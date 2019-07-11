import { assertNever } from 'cms-common'
import * as React from 'react'
import { connect } from 'react-redux'
import { sendDataTreeRequest, setDataTreeDirtiness } from '../../actions/dataTrees'
import { Dispatch } from '../../actions/types'
import { createEmptyDataTreeState } from '../../reducer/dataTrees'
import State from '../../state'
import {
	DataTreeDirtinessState,
	DataTreeRequestReadyState,
	DataTreeRequestType,
	DataTreeState
} from '../../state/dataTrees'
import { MutationRequestResult, ReceivedDataTree } from '../bindingTypes'
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
	setDataTreeDirtiness: (isDirty: DataTreeDirtinessState) => void
	sendDataTreeRequest: (type: DataTreeRequestType, request: string) => void
}

export interface DataProviderStateProps extends DataTreeState {}

type DataProviderInnerProps<DRP> = DataProviderOwnProps<DRP> & DataProviderDispatchProps & DataProviderStateProps

export interface DataProviderState {
	accessorTree?: AccessorTreeRoot
	query?: string
	showingErrors: boolean
}

class DataProvider<DRP> extends React.PureComponent<DataProviderInnerProps<DRP>, DataProviderState, boolean> {
	public state: DataProviderState = {
		accessorTree: undefined,
		query: undefined,
		showingErrors: false
	}

	protected triggerPersist = () => {
		const persistedData =
			this.props.requests.query.readyState === DataTreeRequestReadyState.Success
				? this.props.requests.query.data
				: undefined

		if (!this.state.accessorTree || !this.props.isDirty) {
			return
		}

		const generator = new MutationGenerator(persistedData, this.state.accessorTree, this.props.markerTree)
		const mutation = generator.getPersistMutation()

		console.log('mutation', mutation)
		if (mutation === undefined) {
			return // There's nothing to do
		}

		this.props.sendDataTreeRequest(DataTreeRequestType.Mutation, mutation)
	}

	protected metaOperations: MetaOperationsContextValue = new MetaOperationsAccessor(
		this.props.markerTree.id,
		this.triggerPersist
	)

	async componentDidUpdate(prevProps: DataProviderInnerProps<DRP>, prevState: DataProviderState) {
		const { query, mutation } = this.props.requests
		if (
			mutation.readyState === DataTreeRequestReadyState.Pending ||
			!(query.readyState === DataTreeRequestReadyState.Success || query.readyState === DataTreeRequestReadyState.Error)
		) {
			if (this.state.showingErrors) {
				this.setState({ showingErrors: false })
			}
			return
		}

		if (mutation.readyState === DataTreeRequestReadyState.Success) {
			if (!this.state.query) {
				return
			}
			console.log('query', this.state.query)
			return this.props.sendDataTreeRequest(DataTreeRequestType.Query, this.state.query)
		}

		if (mutation.readyState === DataTreeRequestReadyState.Error) {
			if (this.state.showingErrors) {
				return
			}

			const mutationResult: MutationRequestResult = mutation.data

			console.log('mut error!', mutationResult)
			return this.initializeAccessorTree(query.data, this.state.accessorTree, mutationResult)
		}

		if (query.readyState === DataTreeRequestReadyState.Success) {
			if (prevProps.requests.query.readyState === DataTreeRequestReadyState.Pending) {
				this.initializeAccessorTree(query.data, query.data)
			} else if (
				this.state.accessorTree &&
				prevState.accessorTree &&
				this.state.accessorTree !== prevState.accessorTree &&
				!this.props.isDirty
			) {
				this.props.setDataTreeDirtiness(true)
			}
		} else if (query.readyState === DataTreeRequestReadyState.Error) {
			// TODO handle query error
		} else {
			return assertNever(query)
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
			this.props.sendDataTreeRequest(DataTreeRequestType.Query, query)
			if (!this.unmounted) {
				this.setState({ query })
			}
		} else {
			this.initializeAccessorTree(undefined, undefined)
		}
	}

	public componentWillUnmount() {
		this.unmounted = true
	}

	private initializeAccessorTree(
		persistedData: ReceivedDataTree<undefined> | undefined,
		initialData: AccessorTreeRoot | ReceivedDataTree<undefined> | undefined,
		errors?: MutationRequestResult
	) {
		const accessTreeGenerator = new AccessorTreeGenerator(this.props.markerTree)
		accessTreeGenerator.generateLiveTree(
			persistedData,
			initialData,
			accessorTree => {
				console.log('data', accessorTree)
				this.props.onDataAvailable && this.props.onDataAvailable(accessorTree)
				this.setState({ accessorTree, showingErrors: errors !== undefined })
			},
			errors
		)
	}
}

const getDataProvider = <DRP extends {}>() =>
	connect<DataProviderStateProps, DataProviderDispatchProps, DataProviderOwnProps<DRP>, State>(
		({ dataTrees }, ownProps: DataProviderOwnProps<DRP>) =>
			dataTrees[ownProps.markerTree.id] || createEmptyDataTreeState(),
		(dispatch: Dispatch, ownProps) => ({
			setDataTreeDirtiness: (isDirty: DataTreeDirtinessState) =>
				dispatch(setDataTreeDirtiness(ownProps.markerTree.id, isDirty)),
			sendDataTreeRequest: (type: DataTreeRequestType, request: string) =>
				dispatch(sendDataTreeRequest(ownProps.markerTree.id, type, request))
		})
	)(DataProvider as new (props: DataProviderInnerProps<DRP>) => DataProvider<DRP>)

export { getDataProvider }
