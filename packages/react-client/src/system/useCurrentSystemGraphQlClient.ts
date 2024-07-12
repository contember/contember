import type { GraphQlClient } from '@contember/client'
import { ClientError } from '../ClientError'
import { useProjectSlug } from '../project'
import { useSystemGraphQlClient } from './useSystemGraphQlClient'

export const useCurrentSystemGraphQlClient = (): GraphQlClient => {
	const projectSlug = useProjectSlug()

	if (projectSlug === undefined) {
		throw new ClientError(`Cannot contact the system API: undefined project slug.`)
	}
	return useSystemGraphQlClient(projectSlug)
}
