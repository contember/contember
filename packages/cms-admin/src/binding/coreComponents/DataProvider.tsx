import * as React from 'react'
import { connect, shallowEqual, useSelector } from 'react-redux'
import { sendDataTreeRequest, setDataTreeDirtiness } from '../../actions/dataTrees'
import { Dispatch } from '../../actions/types'
import { createEmptyDataTreeState } from '../../reducer/dataTrees'
import State from '../../state'
import {
	DataTreeDirtinessState,
	DataTreeMutationState,
	DataTreeRequestReadyState,
	DataTreeRequestType,
	DataTreeState,
} from '../../state/dataTrees'
import { MutationRequestResult, MutationResult, ReceivedDataTree } from '../bindingTypes'
import { AccessorTreeRoot, MarkerTreeRoot, MetaOperationsAccessor } from '../dao'
import { DefaultRenderer } from '../facade/renderers'
import { AccessorTreeGenerator, MutationGenerator, QueryGenerator } from '../model'
import { MetaOperationsContext, MetaOperationsContextValue } from './MetaOperationsContext'
import {
	ErrorPersistResult,
	NothingToPersistPersistResult,
	PersistResultErrorType,
	PersistResultSuccessType,
	SuccessfulPersistResult,
} from './PersistResult'
import { DirtinessContext, MutationStateContext } from './PersistState'

export interface DataProviderConfig {
	markerTree: MarkerTreeRoot
	onSuccessfulPersist?: () => void
}

export interface AccessorTreeWithMetadata {
	accessorTree: AccessorTreeRoot | undefined
	isDirty: DataTreeDirtinessState
	isMutating: DataTreeMutationState
	metaOperations: MetaOperationsAccessor
}

export const useAccessorTree = (config: DataProviderConfig): AccessorTreeWithMetadata => {
	const [accessorTree, setAccessorTree] = React.useState<AccessorTreeRoot | undefined>(undefined)
	const emptyDataTreeState = React.useMemo(createEmptyDataTreeState, [])

	const isMutating = useSelector((state: State) =>
		config.markerTree.id in state.dataTrees
			? state.dataTrees[config.markerTree.id].isMutating
			: emptyDataTreeState.isMutating,
	)
	const isDirty = useSelector((state: State) =>
		config.markerTree.id in state.dataTrees
			? state.dataTrees[config.markerTree.id].isDirty
			: emptyDataTreeState.isDirty,
	)
	const requests = useSelector(
		(state: State) =>
			config.markerTree.id in state.dataTrees
				? state.dataTrees[config.markerTree.id].requests
				: emptyDataTreeState.requests,
		shallowEqual,
	)

	const query = React.useMemo(() => {
		console.debug('The structure is', config.markerTree)
		const query = new QueryGenerator(config.markerTree).getReadQuery()
		console.debug('query', query)
		return query
	}, [config.markerTree])

	const triggerPersist = React.useCallback((): Promise<SuccessfulPersistResult> => {
		const persistedData =
			requests.query.readyState === DataTreeRequestReadyState.Success ? requests.query.data : undefined

		if (!accessorTree || !isDirty) {
			return Promise.resolve<NothingToPersistPersistResult>({
				type: PersistResultSuccessType.NothingToPersist,
			})
		}

		const generator = new MutationGenerator(persistedData, accessorTree, config.markerTree)
		const mutation = generator.getPersistMutation()

		console.debug('mutation', mutation)
		if (mutation === undefined) {
			return Promise.resolve<NothingToPersistPersistResult>({
				type: PersistResultSuccessType.NothingToPersist,
			})
		}

		return 123 as any
		//this.props.sendDataTreeRequest(DataTreeRequestType.Mutation, mutation)
		//return new Promise<SuccessfulPersistResult>((resolve, reject) => {
		//	this.setState({
		//		resolvePersistResult: resolve,
		//		rejectPersistResult: reject,
		//	})
		//})
	}, [accessorTree, config.markerTree, isDirty, requests.query])

	const metaOperations = React.useMemo(() => new MetaOperationsAccessor(config.markerTree.id, triggerPersist), [
		config.markerTree.id,
		triggerPersist,
	])

	return React.useMemo<AccessorTreeWithMetadata>(
		() => ({
			accessorTree,
			isDirty,
			isMutating,
			metaOperations,
		}),
		[accessorTree, isDirty, isMutating, metaOperations],
	)
}

/*




















*/

export interface DataRendererProps {
	data?: AccessorTreeRoot | undefined
}

export interface DataProviderOwnProps<DRP> {
	markerTree: MarkerTreeRoot
	renderer?: React.ComponentType<DRP & DataRendererProps>
	rendererProps?: DRP
	onDataAvailable?: (data: DataRendererProps['data']) => void
	onSuccessfulPersist?: () => void
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
	resolvePersistResult?: (s: SuccessfulPersistResult) => void
	rejectPersistResult?: (s: ErrorPersistResult) => void
}

class DataProvider<DRP> extends React.PureComponent<DataProviderInnerProps<DRP>, DataProviderState, boolean> {
	public state: DataProviderState = {
		accessorTree: undefined,
		query: undefined,
		showingErrors: false,
		resolvePersistResult: undefined,
		rejectPersistResult: undefined,
	}

	protected triggerPersist = (): Promise<SuccessfulPersistResult> => {
		const persistedData =
			this.props.requests.query.readyState === DataTreeRequestReadyState.Success
				? this.props.requests.query.data
				: undefined

		if (!this.state.accessorTree || !this.props.isDirty) {
			return Promise.resolve<NothingToPersistPersistResult>({
				type: PersistResultSuccessType.NothingToPersist,
			})
		}

		const generator = new MutationGenerator(persistedData, this.state.accessorTree, this.props.markerTree)
		const mutation = generator.getPersistMutation()

		console.debug('mutation', mutation)
		if (mutation === undefined) {
			return Promise.resolve<NothingToPersistPersistResult>({
				type: PersistResultSuccessType.NothingToPersist,
			})
		}

		this.props.sendDataTreeRequest(DataTreeRequestType.Mutation, mutation)
		return new Promise<SuccessfulPersistResult>((resolve, reject) => {
			this.setState({
				resolvePersistResult: resolve,
				rejectPersistResult: reject,
			})
		})
	}

	protected metaOperations: MetaOperationsContextValue = new MetaOperationsAccessor(
		this.props.markerTree.id,
		this.triggerPersist,
	)

	async componentDidUpdate(prevProps: DataProviderInnerProps<DRP>) {
		const { query, mutation } = this.props.requests
		if (
			mutation.readyState === DataTreeRequestReadyState.Pending ||
			query.readyState === DataTreeRequestReadyState.Pending ||
			(query.readyState === DataTreeRequestReadyState.Uninitialized &&
				mutation.readyState !== DataTreeRequestReadyState.Success &&
				mutation.readyState !== DataTreeRequestReadyState.Error)
		) {
			if (this.state.showingErrors) {
				this.setState({ showingErrors: false })
			}
			return
		}

		if (mutation.readyState === DataTreeRequestReadyState.Success) {
			this.props.onSuccessfulPersist && this.props.onSuccessfulPersist()
			this.state.resolvePersistResult &&
				this.state.resolvePersistResult({
					persistedEntityId: (mutation.data as MutationRequestResult)[this.props.markerTree.id].node.id,
					type: PersistResultSuccessType.JustSuccess,
				})
			if (!this.state.query) {
				return
			}
			console.debug('query', this.state.query)
			return this.props.sendDataTreeRequest(DataTreeRequestType.Query, this.state.query)
		}

		if (mutation.readyState === DataTreeRequestReadyState.Error) {
			this.state.rejectPersistResult &&
				this.state.rejectPersistResult({
					type: PersistResultErrorType.UnknownError, // TODO this is a temporary & unfounded assumption
				})
			if (this.state.showingErrors) {
				return
			}

			const mutationResult: MutationRequestResult = mutation.data

			console.debug('mut error!', mutationResult)
			return this.initializeAccessorTree(
				query.readyState === DataTreeRequestReadyState.Success || query.readyState === DataTreeRequestReadyState.Error
					? query.data
					: undefined,
				this.state.accessorTree,
				mutationResult,
			)
		}

		if (query.readyState === DataTreeRequestReadyState.Success) {
			if (prevProps.requests.query.readyState === DataTreeRequestReadyState.Pending) {
				this.initializeAccessorTree(query.data, query.data)
			} else if (this.state.accessorTree) {
				const generator = new MutationGenerator(query.data, this.state.accessorTree, this.props.markerTree)
				const mutation = generator.getPersistMutation() // TODO this REALLY should go off the UI thread
				this.props.setDataTreeDirtiness(mutation !== undefined)
			}
		} else if (query.readyState === DataTreeRequestReadyState.Error) {
			// TODO handle query error
			return
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
		console.debug('The structure is', this.props.markerTree)

		const query = new QueryGenerator(this.props.markerTree).getReadQuery()

		console.debug('query', query)
		if (query) {
			this.props.sendDataTreeRequest(DataTreeRequestType.Query, query)
			if (!this.unmounted) {
				this.setState({ query })
			}
		} else {
			this.initializeAccessorTree(undefined, undefined)
			this.props.setDataTreeDirtiness(true)
		}
	}

	public componentWillUnmount() {
		this.unmounted = true
	}

	private initializeAccessorTree(
		persistedData: ReceivedDataTree<undefined> | undefined,
		initialData: AccessorTreeRoot | ReceivedDataTree<undefined> | undefined,
		errors?: MutationRequestResult,
	) {
		const accessTreeGenerator = new AccessorTreeGenerator(this.props.markerTree)
		accessTreeGenerator.generateLiveTree(
			persistedData,
			initialData,
			accessorTree => {
				console.debug('data', accessorTree)
				this.props.onDataAvailable && this.props.onDataAvailable(accessorTree)
				this.setState({ accessorTree, showingErrors: errors !== undefined })
			},
			errors,
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
			sendDataTreeRequest: (type: DataTreeRequestType, request: string): any =>
				dispatch(sendDataTreeRequest(ownProps.markerTree.id, type, request)), // "any" because of redux-thunk typings
		}),
	)(DataProvider as new (props: DataProviderInnerProps<DRP>) => DataProvider<DRP>)

export { getDataProvider }
