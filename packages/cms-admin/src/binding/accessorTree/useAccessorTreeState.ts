import { GraphQlClient } from 'cms-client'
import * as React from 'react'
import { ApiRequestReadyState, useAuthToken, useContentApiRequest } from '../../apiClient'
import { useEnvironment } from '../accessorRetrievers'
import { AccessorTreeRoot } from '../dao'
import { AccessorTreeGenerator, MarkerTreeGenerator, MutationGenerator, QueryGenerator } from '../model'
import { AccessorTreeState, AccessorTreeStateName } from './AccessorTreeState'
import { AccessorTreeStateActionType } from './AccessorTreeStateActionType'
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

export const useAccessorTreeState = (nodeTree: React.ReactNode): AccessorTreeState => {
	const environment = useEnvironment()
	const authToken = useAuthToken()

	const normalizedEnvironment = React.useMemo(() => {
		let id = 0
		return environment.putSystemVariable('treeIdFactory', () => id++)
	}, [environment])
	const markerTree = React.useMemo(() => new MarkerTreeGenerator(nodeTree, normalizedEnvironment).generate(), [
		normalizedEnvironment,
		nodeTree,
	])
	const accessorTreeGenerator = React.useMemo(() => new AccessorTreeGenerator(markerTree), [markerTree])
	const query = React.useMemo(() => new QueryGenerator(markerTree).getReadQuery(), [markerTree])
	const [state, dispatch] = React.useReducer(accessorTreeStateReducer, initialState)
	const [queryState, sendQuery] = useContentApiRequest<QueryRequestResponse>()
	const [mutationState, sendMutation] = useContentApiRequest<MutationRequestResponse>()

	// This ref is really just an implementation of the advice from https://reactjs.org/docs/hooks-faq.html#can-i-run-an-effect-only-on-updates
	const isFirstRenderRef = React.useRef(true)
	const isForcingRefreshRef = React.useRef(false) // This ref is described in detail below.

	const stateRef = React.useRef(state)
	const queryStateRef = React.useRef(queryState)

	stateRef.current = state
	queryStateRef.current = queryState

	const rejectFailedRequest = React.useCallback((metadata: GraphQlClient.FailedRequestMetadata) => {
		const error = metadataToRequestError(metadata)
		dispatch({
			type: AccessorTreeStateActionType.ResolveRequestWithError,
			error,
		})
		return Promise.reject(error)
	}, [])

	const triggerPersist = React.useCallback((): Promise<SuccessfulPersistResult> => {
		if (stateRef.current.name === AccessorTreeStateName.Interactive) {
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
			return sendMutation(mutation, {}, authToken)
				.catch(rejectFailedRequest)
				.then(data => {
					const normalizedData = data.data === null ? {} : data.data
					const aliases = Object.keys(normalizedData)
					const allSubMutationsOk = aliases.every(item => data.data[item].ok)

					if (!allSubMutationsOk) {
						accessorTreeGenerator.generateLiveTree(
							persistedData,
							latestAccessorTree,
							accessorTree => {
								dispatch({
									type: AccessorTreeStateActionType.SetData,
									data: accessorTree,
									triggerPersist,
								})
							},
							data.data,
						)
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

					return sendQuery(query, {}, authToken)
						.then(queryData => {
							accessorTreeGenerator.generateLiveTree(queryData.data, queryData.data, accessorTree => {
								dispatch({
									type: AccessorTreeStateActionType.SetData,
									data: accessorTree,
									triggerPersist,
								})
							})
							return Promise.resolve({
								type: PersistResultSuccessType.JustSuccess,
								persistedEntityIds,
							})
						})
						.catch(() => {
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
						})
				})
		}
		return Promise.resolve<NothingToPersistPersistResult>({
			type: PersistResultSuccessType.NothingToPersist,
		})
	}, [accessorTreeGenerator, authToken, markerTree, query, rejectFailedRequest, sendMutation, sendQuery])

	const initializeAccessorTree = React.useCallback(
		(
			persistedData: ReceivedDataTree<undefined> | undefined,
			initialData: AccessorTreeRoot | ReceivedDataTree<undefined> | undefined,
			errors?: MutationDataResponse,
		) => {
			accessorTreeGenerator.generateLiveTree(
				persistedData,
				initialData,
				accessorTree => {
					console.debug('data', accessorTree)
					dispatch({
						type: AccessorTreeStateActionType.SetData,
						data: accessorTree,
						triggerPersist,
					})
				},
				errors,
			)
		},
		[accessorTreeGenerator, triggerPersist],
	)

	React.useEffect(() => {
		if (
			state.name === AccessorTreeStateName.Uninitialized &&
			// There can be updates while state.name is still AccessorTreeStateName.Uninitialized, and so that condition is
			// not sufficient on its own. Thus we typically also enforce that queryStateRef.current.readyState is
			// ApiRequestReadyState.Uninitialized. However, we may need to force a change even while both conditions hold,
			// e.g. while a query is loading. For that we have a special ref which we always reset after we're done.
			(isForcingRefreshRef.current || queryStateRef.current.readyState === ApiRequestReadyState.Uninitialized)
		) {
			if (query === undefined) {
				// We're creating
				initializeAccessorTree(undefined, undefined)
				isForcingRefreshRef.current = false
			} else {
				dispatch({
					type: AccessorTreeStateActionType.InitializeQuery,
				})
				sendQuery(query, {}, authToken)
					.then(data => {
						initializeAccessorTree(data.data, data.data)
						return Promise.resolve()
					})
					.catch(rejectFailedRequest)
					.finally(() => {
						isForcingRefreshRef.current = false
					})
			}
		}
	}, [authToken, initializeAccessorTree, query, queryState.readyState, rejectFailedRequest, sendQuery, state.name])

	React.useEffect(() => {
		if (queryState.readyState === ApiRequestReadyState.Success && state.name === AccessorTreeStateName.Interactive) {
			const generator = new MutationGenerator(queryState.data.data, state.data, markerTree)

			// TODO this is not as bad as it's an effect, and thus it doesn't block but it should still go off the UI thread.
			const persistMutation = generator.getPersistMutation()

			const newIsDirty = persistMutation !== undefined

			if (state.isDirty !== newIsDirty) {
				dispatch({
					type: AccessorTreeStateActionType.SetDirtiness,
					isDirty: newIsDirty,
				})
			}
		}
	}, [markerTree, queryState, state])

	// We're using the ref to react to a *change* of the query (e.g. due to changed dimensions). We don't want this effect
	// to run during the initial render.
	React.useEffect(() => {
		if (!isFirstRenderRef.current) {
			isForcingRefreshRef.current = true
			dispatch({
				type: AccessorTreeStateActionType.Uninitialize,
			})
		}
	}, [query])

	// For this to work, this effect must be the last one to run.
	React.useEffect(() => {
		isFirstRenderRef.current = false
	}, [])

	return state
}
