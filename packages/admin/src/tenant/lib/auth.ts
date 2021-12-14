import { GraphQlClientVariables, useCurrentContentGraphQlClient, useTenantGraphQlClient } from '@contember/react-client'
import { useMutation, UseMutationReturn } from './useMutation'
import { useQuery } from './useQuery'
import type { QueryRequestObject } from './requestState'

export const useAuthedTenantQuery = <R, V extends GraphQlClientVariables>(query: string, variables: V): QueryRequestObject<R> => {
	const client = useTenantGraphQlClient()
	return useQuery(client, query, variables)
}

export const useAuthedTenantMutation = <R, V extends GraphQlClientVariables>(query: string): UseMutationReturn<R, V> => {
	const client = useTenantGraphQlClient()
	return useMutation(client, query)
}

export const useAuthedContentQuery = <R, V extends GraphQlClientVariables>(query: string, variables: V): QueryRequestObject<R> => {
	const client = useCurrentContentGraphQlClient()
	return useQuery(client, query, variables)
}

export const useAuthedContentMutation = <R, V extends GraphQlClientVariables>(query: string): UseMutationReturn<R, V> => {
	const client = useCurrentContentGraphQlClient()
	return useMutation(client, query)
}
