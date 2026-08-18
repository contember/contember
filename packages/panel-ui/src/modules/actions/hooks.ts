import * as ActionsApi from '@contember/graphql-client-actions'
import { useCurrentActionsGraphQlClient } from '@contember/react-client'
import { type ModelType, ParameterRef } from 'graphql-ts-client-api'
import { useCallback } from 'react'
import { type FetcherExecutor, useFetcherExecutor } from '../../shell/generatedApi.js'

/** The current project's actions API: the client resolves `/panel/api/actions/<project>` from the project scope. */
const useActionsApi = (): FetcherExecutor => useFetcherExecutor(useCurrentActionsGraphQlClient())

/** A row omits the payload on purpose — a queue table would otherwise download every webhook body to render itself. */
const eventListFragment = ActionsApi.event$
	.id
	.state
	.stage
	.target
	.createdAt
	.lastStateChange
	.numRetries
	.log

export type ActionsEventListItem = ModelType<typeof eventListFragment>
export type ActionsEventDetail = ModelType<typeof ActionsApi.event$$>
export type ActionsVariable = ModelType<typeof ActionsApi.variable$$>

/** `EventArgs` is offset and limit and nothing else: no cursor, no total, so a page is only ever "what fits". */
export type EventListVariables = { offset: number; limit: number }
export type EventListFetcher = (variables: EventListVariables) => Promise<readonly ActionsEventListItem[]>

export const useFailedEventsQuery = (): EventListFetcher => {
	const executor = useActionsApi()
	return useCallback(async ({ offset, limit }: EventListVariables): Promise<readonly ActionsEventListItem[]> => {
		const result = await executor(ActionsApi.query$.failedEvents({ args: ParameterRef.of('args') }, eventListFragment), {
			variables: { args: { offset, limit } },
		})

		return result.failedEvents
	}, [executor])
}

export const useEventsToProcessQuery = (): EventListFetcher => {
	const executor = useActionsApi()
	return useCallback(async ({ offset, limit }: EventListVariables): Promise<readonly ActionsEventListItem[]> => {
		const result = await executor(ActionsApi.query$.eventsToProcess({ args: ParameterRef.of('args') }, eventListFragment), {
			variables: { args: { offset, limit } },
		})

		return result.eventsToProcess
	}, [executor])
}

export const useEventsInProcessingQuery = (): EventListFetcher => {
	const executor = useActionsApi()
	return useCallback(async ({ offset, limit }: EventListVariables): Promise<readonly ActionsEventListItem[]> => {
		const result = await executor(ActionsApi.query$.eventsInProcessing({ args: ParameterRef.of('args') }, eventListFragment), {
			variables: { args: { offset, limit } },
		})

		return result.eventsInProcessing
	}, [executor])
}

export type EventQueryVariables = { id: string }

/** Answers `undefined` for an id that matches nothing — a stale link is not a failure. */
export const useEventQuery = () => {
	const executor = useActionsApi()
	return useCallback(async ({ id }: EventQueryVariables): Promise<ActionsEventDetail | undefined> => {
		const result = await executor(ActionsApi.query$.event({ id: ParameterRef.of('id') }, ActionsApi.event$$), { variables: { id } })

		return result.event
	}, [executor])
}

export const useVariablesQuery = () => {
	const executor = useActionsApi()
	return useCallback(async ({}: {} = {}): Promise<readonly ActionsVariable[]> => {
		const result = await executor(ActionsApi.query$.variables(ActionsApi.variable$$))

		return result.variables
	}, [executor])
}

/**
 * Every mutation answers a bare `{ ok: true }` and reports a refusal by throwing, so nothing here has
 * a result worth returning — the caller reacts to the rejection instead.
 */
export const useProcessBatchMutation = (): () => Promise<void> => {
	const executor = useActionsApi()
	return useCallback(async (): Promise<void> => {
		await executor(ActionsApi.mutation$.processBatch(ActionsApi.processBatchResponse$$))
	}, [executor])
}

export const useRetryEventMutation = (): (id: string) => Promise<void> => {
	const executor = useActionsApi()
	return useCallback(async (id: string): Promise<void> => {
		await executor(ActionsApi.mutation$.retryEvent({ id: ParameterRef.of('id') }, ActionsApi.retryEventResponse$$), { variables: { id } })
	}, [executor])
}

export const useStopEventMutation = (): (id: string) => Promise<void> => {
	const executor = useActionsApi()
	return useCallback(async (id: string): Promise<void> => {
		await executor(ActionsApi.mutation$.stopEvent({ id: ParameterRef.of('id') }, ActionsApi.stopEventResponse$$), { variables: { id } })
	}, [executor])
}

export const useSetVariablesMutation = (): (args: ActionsApi.SetVariablesArgs) => Promise<void> => {
	const executor = useActionsApi()
	return useCallback(async (args: ActionsApi.SetVariablesArgs): Promise<void> => {
		await executor(ActionsApi.mutation$.setVariables({ args: ParameterRef.of('args') }, ActionsApi.setVariablesResponse$$), { variables: { args } })
	}, [executor])
}
