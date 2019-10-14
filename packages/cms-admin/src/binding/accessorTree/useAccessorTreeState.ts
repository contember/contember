import { GraphQlClient } from 'cms-client'
import * as React from 'react'
import { ApiRequestReadyState, useAuthToken, useContentApiRequest, useIsFirstRenderRef } from '../../apiClient'
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

	const isFirstRenderRef = useIsFirstRenderRef()
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
					const aliases = data.data === null ? [] : Object.keys(data.data)
					const allSubMutationsOk = aliases.every(item => data.data[item].ok)
					const persistedEntityIds = aliases.map(alias => data.data[alias].node.id)

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
		if (state.name === AccessorTreeStateName.Uninitialized) {
			if (query === undefined) {
				// We're creating
				initializeAccessorTree(undefined, undefined)
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

	React.useEffect(() => {
		if (!isFirstRenderRef.current) {
			dispatch({
				type: AccessorTreeStateActionType.Uninitialize,
			})
		}
	}, [query, isFirstRenderRef])

	return state
}
