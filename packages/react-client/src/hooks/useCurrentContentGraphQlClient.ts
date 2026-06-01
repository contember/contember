import type { GraphQlClient } from '@contember/graphql-client'
import { ClientError } from '../ClientError.js'
import { useProjectSlug, useStageSlug } from '../contexts.js'
import { useContentGraphQlClient } from './useContentGraphQlClient.js'

export const useCurrentContentGraphQlClient = (): GraphQlClient => {
	const projectSlug = useProjectSlug()
	const stageSlug = useStageSlug()

	if (projectSlug === undefined) {
		throw new ClientError(`Cannot contact the content API: undefined project slug.`)
	}
	if (stageSlug === undefined) {
		throw new ClientError(`Cannot contact the content API: undefined stage slug.`)
	}
	return useContentGraphQlClient(projectSlug, stageSlug)
}
