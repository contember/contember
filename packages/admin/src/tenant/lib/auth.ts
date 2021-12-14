import { useCurrentContentGraphQlClient, useSessionToken, useTenantGraphQlClient } from '@contember/react-client'
import { useMutation, UseMutationReturn } from './mutation'
import { useQuery } from './query'
import type { QueryRequestObject } from './requestState'

export const useAuthedTenantQuery = <R, V>(query: string, variables: V): QueryRequestObject<R> => {
	const token = useSessionToken()
	const client = useTenantGraphQlClient()
	if (client === undefined) {
		throw new Error('Cannot get a tenant client - maybe missing config context?')
	}
	return useQuery(client, query, variables, token)
}

export const useAuthedTenantMutation = <R, V>(query: string): UseMutationReturn<R, V> => {
	const token = useSessionToken()
	const client = useTenantGraphQlClient()
	if (client === undefined) {
		throw new Error('Cannot get a tenant client - maybe missing config context?')
	}
	return useMutation(client, query, token)
}

export const useAuthedContentQuery = <R, V>(query: string, variables: V): QueryRequestObject<R> => {
	const token = useSessionToken()
	const client = useCurrentContentGraphQlClient()
	if (client === undefined) {
		throw new Error('Cannot get a content client - maybe missing config context?')
	}
	return useQuery(client, query, variables, token)
}

export const useAuthedContentMutation = <R, V>(query: string): UseMutationReturn<R, V> => {
	const token = useSessionToken()
	const client = useCurrentContentGraphQlClient()
	if (client === undefined) {
		throw new Error('Cannot get a content client - maybe missing config context?')
	}
	return useMutation(client, query, token)
}
