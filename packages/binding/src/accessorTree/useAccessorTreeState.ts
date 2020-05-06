import { GraphQlClient } from '@contember/client'
import { ApiRequestReadyState, useContentApiRequest, useSessionToken } from '@contember/react-client'
import { noop } from '@contember/react-utils'
import * as React from 'react'
import { useEnvironment } from '../accessorRetrievers'
import { RootAccessor } from '../accessors'
import {
	AccessorTreeGenerator,
	DirtinessChecker,
	MarkerTreeGenerator,
	MutationGenerator,
	QueryGenerator,
} from '../model'
import { AccessorTreeState, AccessorTreeStateName } from './AccessorTreeState'
import { AccessorTreeStateActionType } from './AccessorTreeStateActionType'
import { AccessorTreeStateMetadata } from './AccessorTreeStateMetadata'
import { AccessorTreeStateOptions } from './AccessorTreeStateOptions'
import { accessorTreeStateReducer } from './accessorTreeStateReducer'
import { metadataToRequestError } from './metadataToRequestError'
import { MutationDataResponse, MutationRequestResponse } from './MutationRequestResponse'
import {
	MutationErrorType,
	NothingToPersistPersistResult,
	PersistResultSuccessType,
	SuccessfulPersistResult,
} from './PersistResult'
import { QueryRequestResponse, ReceivedDataTree } from './QueryRequestResponse'

const initialState: AccessorTreeState = {
	name: AccessorTreeStateName.Uninitialized,
}

export const useAccessorTreeState = ({
	nodeTree,
	autoInitialize = true,
	unstable_onSuccessfulPersist = noop,
}: AccessorTreeStateOptions): [AccessorTreeState, AccessorTreeStateMetadata] => {
	const environment = useEnvironment()
	const sessionToken = useSessionToken()

	const normalizedEnvironment = React.useMemo(() => {
		let id = 0
		return environment.putSystemVariable('treeIdFactory', () => id++)
	}, [environment])
	const markerTree = React.useMemo(() => new MarkerTreeGenerator(nodeTree, normalizedEnvironment).generate(), [
		normalizedEnvironment,
		nodeTree,
	])

	// TODO this REALLY should be useState.
	const accessorTreeGenerator = React.useMemo(() => new AccessorTreeGenerator(markerTree), [markerTree])
	const query = React.useMemo(() => new QueryGenerator(markerTree).getReadQuery(), [markerTree])
	const [state, dispatch] = React.useReducer(accessorTreeStateReducer, initialState)
	const [queryState, sendQuery] = useContentApiRequest<QueryRequestResponse>()
	const [mutationState, sendMutation] = useContentApiRequest<MutationRequestResponse>()

	const [isInitialized, setIsInitialized] = React.useState(autoInitialize)

	// This ref is really just an implementation of the advice from https://reactjs.org/docs/hooks-faq.html#can-i-run-an-effect-only-on-updates
	const isFirstRenderRef = React.useRef(true)
	const isMountedRef = React.useRef(true)
	const isForcingRefreshRef = React.useRef(false) // This ref is described in detail below.

	const queryRef = React.useRef(query)
	const stateRef = React.useRef(state)
	const dirtinessCheckerRef = React.useRef<DirtinessChecker | undefined>(undefined)
	const queryStateRef = React.useRef(queryState)

	stateRef.current = state
	queryStateRef.current = queryState

	const initialize = React.useCallback(() => {
		if (!isInitialized) {
			setIsInitialized(true)
		}
	}, [isInitialized])
	const stateMetadata: AccessorTreeStateMetadata = {
		initialize: autoInitialize ? undefined : initialize,
	}

	const rejectFailedRequest = React.useCallback((metadata: GraphQlClient.FailedRequestMetadata) => {
		const error = metadataToRequestError(metadata)
		dispatch({
			type: AccessorTreeStateActionType.ResolveRequestWithError,
			error,
		})
		return error
	}, [])

	const triggerPersistRef = React.useRef<(() => Promise<SuccessfulPersistResult>) | undefined>(undefined)

	// TODO re-think the whole onSuccessfulPersist API. This is more of a temporary hotfix
	const triggerPersist = React.useCallback(async () => {
		try {
			const result = await triggerPersistRef.current!()
			unstable_onSuccessfulPersist(result)
			return Promise.resolve(result)
		} catch (e) {
			return Promise.reject(e)
		}
	}, [unstable_onSuccessfulPersist])

	const initializeAccessorTree = React.useCallback(
		(
			persistedData: ReceivedDataTree<undefined> | undefined,
			initialData: RootAccessor | ReceivedDataTree<undefined> | undefined,
			errors?: MutationDataResponse,
		) => {
			accessorTreeGenerator.generateLiveTree(
				persistedData,
				initialData,
				accessor => {
					console.debug('data', accessor)
					dispatch({
						type: AccessorTreeStateActionType.SetData,
						data: accessor,
						triggerPersist,
					})
				},
				errors,
			)
			dirtinessCheckerRef.current = new DirtinessChecker(markerTree, persistedData)
		},
		[accessorTreeGenerator, markerTree, triggerPersist],
	)

	triggerPersistRef.current = async (): Promise<SuccessfulPersistResult> => {
		if (stateRef.current.name !== AccessorTreeStateName.Interactive) {
			return Promise.resolve<NothingToPersistPersistResult>({
				type: PersistResultSuccessType.NothingToPersist,
			})
		}
		const persistedData =
			queryStateRef.current.readyState === ApiRequestReadyState.Success ? queryStateRef.current.data.data : undefined

		const latestAccessorTree = stateRef.current.data
		const generator = new MutationGenerator(persistedData, latestAccessorTree, markerTree)
		const mutation = generator.getPersistMutation()

		if (mutation === undefined) {
			return Promise.resolve<NothingToPersistPersistResult>({
				type: PersistResultSuccessType.NothingToPersist,
			})
		}
		dispatch({
			type: AccessorTreeStateActionType.InitializeMutation,
		})
		try {
			const data = await sendMutation(mutation, {}, sessionToken)
			const normalizedData = data.data === null ? {} : data.data
			const aliases = Object.keys(normalizedData)
			const allSubMutationsOk = aliases.every(item => data.data[item].ok)

			if (!allSubMutationsOk) {
				initializeAccessorTree(persistedData, latestAccessorTree, data.data)
				return Promise.reject({
					type: MutationErrorType.InvalidInput,
				})
			}
			const persistedEntityIds = aliases.map(alias => data.data[alias].node.id)

			if (!query) {
				dispatch({
					type: AccessorTreeStateActionType.SetData,
					data: latestAccessorTree,
					triggerPersist,
				})
				return Promise.resolve({
					type: PersistResultSuccessType.JustSuccess,
					persistedEntityIds,
				})
			}

			try {
				const queryData = await sendQuery(query, {}, sessionToken)
				initializeAccessorTree(queryData.data, queryData.data)
				return Promise.resolve({
					type: PersistResultSuccessType.JustSuccess,
					persistedEntityIds,
				})
			} catch {
				dispatch({
					type: AccessorTreeStateActionType.SetData,
					data: latestAccessorTree,
					triggerPersist,
				})
				// This is rather tricky. Since the mutation went well, we don't care how the subsequent query goes as the
				// data made it successfully to the server. Thus we'll just resolve from here no matter what.
				return Promise.resolve({
					type: PersistResultSuccessType.JustSuccess,
					persistedEntityIds,
				})
			}
		} catch (metadata) {
			return Promise.reject(rejectFailedRequest(metadata))
		}
	}

	// We're using the ref to react to a *change* of the query (e.g. due to changed dimensions).
	if (query !== queryRef.current) {
		isForcingRefreshRef.current = true
		dispatch({
			type: AccessorTreeStateActionType.Uninitialize,
		})
	}
	queryRef.current = query

	React.useEffect(() => {
		const performEffect = async () => {
			if (
				isInitialized &&
				state.name === AccessorTreeStateName.Uninitialized &&
				// There can be updates while state.name is still AccessorTreeStateName.Uninitialized, and so that condition is
				// not sufficient on its own. Thus we typically also enforce that queryStateRef.current.readyState is
				// ApiRequestReadyState.Uninitialized. However, we may need to force a change even while both conditions hold,
				// e.g. while a query is loading. For that we have a special ref which we always reset after we're done.
				(isForcingRefreshRef.current || queryStateRef.current.readyState === ApiRequestReadyState.Uninitialized)
			) {
				if (query === undefined) {
					// We're creating AND there are no subqueries
					initializeAccessorTree(undefined, undefined)
					isForcingRefreshRef.current = false
				} else {
					dispatch({
						type: AccessorTreeStateActionType.InitializeQuery,
					})
					try {
						const data = await sendQuery(query, {}, sessionToken)
						isMountedRef.current && initializeAccessorTree(data.data, data.data)
					} catch (metadata) {
						rejectFailedRequest(metadata)
					} finally {
						isForcingRefreshRef.current = false
					}
				}
			}
		}
		performEffect()
	}, [initializeAccessorTree, isInitialized, query, rejectFailedRequest, sendQuery, sessionToken, state.name])

	const rootAccessor = state.name === AccessorTreeStateName.Interactive ? state.data : undefined
	React.useEffect(() => {
		const dirtinessChecker = dirtinessCheckerRef.current
		if (rootAccessor && dirtinessChecker) {
			const newIsDirty = dirtinessChecker.isDirty(rootAccessor)

			dispatch({
				type: AccessorTreeStateActionType.SetDirtiness,
				isDirty: newIsDirty,
			})
		}
	}, [rootAccessor])

	// For this to work, this effect must be the last one to run.
	React.useEffect(() => {
		isFirstRenderRef.current = false

		return () => {
			isMountedRef.current = false
		}
	}, [])

	return [state, stateMetadata]
}
