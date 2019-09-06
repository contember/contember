import { useSelector } from 'react-redux'
import State from '../../../state'
import { AuthIdentity } from '../../../state/auth'
import { QueryRequestObject } from './requestState'
import { useQuery } from './query'
import { useMutation, UseMutationReturn } from './mutation'
import { useGraphqlTenantClient } from './client'
import { useCurrentContentGraphqlClient } from './project'

export const useAuth = () => useSelector<State, AuthIdentity | null>(state => state.auth.identity)

export const useToken = (): string | undefined => {
	const auth = useAuth()
	return auth != null ? auth.token : undefined
}

export const useAuthedTenantQuery = <R, V>(query: string, variables: V): QueryRequestObject<R> => {
	const token = useToken()
	const client = useGraphqlTenantClient()
	if (client === undefined) {
		throw new Error('Cannot get a tenant client - maybe missing config context?')
	}
	return useQuery(client, query, variables, token)
}

export const useAuthedTenantMutation = <R, V>(query: string): UseMutationReturn<R, V> => {
	const token = useToken()
	const client = useGraphqlTenantClient()
	if (client === undefined) {
		throw new Error('Cannot get a tenant client - maybe missing config context?')
	}
	return useMutation(client, query, token)
}

export const useAuthedContentQuery = <R, V>(query: string, variables: V): QueryRequestObject<R> => {
	const token = useToken()
	const client = useCurrentContentGraphqlClient()
	if (client === undefined) {
		throw new Error('Cannot get a tenant client - maybe missing config context?')
	}
	return useQuery(client, query, variables, token)
}
