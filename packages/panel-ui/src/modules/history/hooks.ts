import * as SystemApi from '@contember/graphql-client-system'
import { useCurrentSystemGraphQlClient } from '@contember/react-client'
import { type ModelType, ParameterRef } from 'graphql-ts-client-api'
import { useCallback } from 'react'
import { useFetcherExecutor } from '../../shell/generatedApi.js'

/**
 * The interface fields plus each concrete type's values.
 *
 * The values are read back with `'newValues' in event` rather than by `__typename`: the generated
 * fetcher DSL types the branches by `__typename` but has no way to select it, so it never arrives.
 */
const eventFragment = SystemApi.event$$
	.on(SystemApi.createEvent$.newValues)
	.on(SystemApi.updateEvent$.oldValues.diffValues)
	.on(SystemApi.deleteEvent$.oldValues)

export type HistoryEvent = ModelType<typeof eventFragment>

export interface EventsQueryVariables {
	args: SystemApi.EventsArgs
}

export const useEventsQuery = () => {
	const executor = useFetcherExecutor(useCurrentSystemGraphQlClient())

	return useCallback(async (variables: EventsQueryVariables): Promise<readonly HistoryEvent[]> => {
		const result = await executor(SystemApi.query$.events({ args: ParameterRef.of('args') }, eventFragment), { variables })

		return result.events
	}, [executor])
}
