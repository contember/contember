import { useAuthIdentity, useCurrentContentGraphQlClient, useTenantGraphQlClient } from '../../../apiClient'
import { useMutation, UseMutationReturn } from './mutation'
import { useQuery } from './query'
import { QueryRequestObject } from './requestState'

export const useToken = () => {
	const auth = useAuthIdentity()
	return auth ? auth.token : undefined
}

export const useAuthedTenantQuery = <R, V>(query: string, variables: V): QueryRequestObject<R> => {
	const token = useToken()
	const client = useTenantGraphQlClient()
	if (client === undefined) {
		throw new Error('Cannot get a tenant client - maybe missing config context?')
	}
	return useQuery(client, query, variables, token)
}

export const useAuthedTenantMutation = <R, V>(query: string): UseMutationReturn<R, V> => {
	const token = useToken()
	const client = useTenantGraphQlClient()
	if (client === undefined) {
		throw new Error('Cannot get a tenant client - maybe missing config context?')
	}
	return useMutation(client, query, token)
}

export const useAuthedContentQuery = <R, V>(query: string, variables: V): QueryRequestObject<R> => {
	const token = useToken()
	const client = useCurrentContentGraphQlClient()
	if (client === undefined) {
		throw new Error('Cannot get a tenant client - maybe missing config context?')
	}
	return useQuery(client, query, variables, token)
}
