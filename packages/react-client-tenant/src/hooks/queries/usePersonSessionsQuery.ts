import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType, ParameterRef } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi.js'
import { useCallback } from 'react'

const sessionFragment = TenantApi.sessionInfo$$

export type PersonSessionsQueryResult = readonly ModelType<typeof sessionFragment>[]

export type PersonSessionsQueryVariables = {
	personId: string
}

export const usePersonSessionsQuery = (options: TenantApiOptions = {}) => {
	const executor = useTenantApi(options)
	return useCallback(async ({ personId }: PersonSessionsQueryVariables): Promise<PersonSessionsQueryResult> => {
		const result = await executor(
			TenantApi.query$.personById(
				{ id: ParameterRef.of('personId') },
				TenantApi.person$.identity(TenantApi.identity$.sessions(sessionFragment)),
			),
			{ variables: { personId } },
		)

		return result.personById?.identity.sessions ?? []
	}, [executor])
}
