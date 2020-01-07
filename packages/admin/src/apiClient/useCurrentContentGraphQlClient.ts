import { ClientError } from './ClientError'
import { useProjectSlug, useStageSlug } from './project'
import { useContentGraphQlClient } from './useContentGraphQlClient'

export const useCurrentContentGraphQlClient = () => {
	const project = useProjectSlug()
	const stage = useStageSlug()

	if (project === undefined || stage === undefined) {
		throw new ClientError()
	}
	return useContentGraphQlClient(project, stage)
}
