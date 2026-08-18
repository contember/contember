import type { GraphQlClient } from '@contember/graphql-client'
import { ClientError } from '../ClientError.js'
import { useProjectSlug } from '../contexts.js'
import { useActionsGraphQlClient } from './useActionsGraphQlClient.js'

export const useCurrentActionsGraphQlClient = (): GraphQlClient => {
	const projectSlug = useProjectSlug()

	if (projectSlug === undefined) {
		throw new ClientError(`Cannot contact the actions API: undefined project slug.`)
	}
	return useActionsGraphQlClient(projectSlug)
}
