import type { GraphQlClient } from '@contember/client'
import { ClientError } from '../ClientError'
import { useProjectSlug, useStageSlug } from '../project'
import { useContentGraphQlClient } from './useContentGraphQlClient'

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
