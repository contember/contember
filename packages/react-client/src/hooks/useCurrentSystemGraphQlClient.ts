import type { GraphQlClient } from '@contember/graphql-client'
import { ClientError } from '../ClientError.js'
import { useProjectSlug } from '../contexts.js'
import { useSystemGraphQlClient } from './useSystemGraphQlClient.js'

export const useCurrentSystemGraphQlClient = (): GraphQlClient => {
	const projectSlug = useProjectSlug()

	if (projectSlug === undefined) {
		throw new ClientError(`Cannot contact the system API: undefined project slug.`)
	}
	return useSystemGraphQlClient(projectSlug)
}
