import { ApiClientError } from './ApiClientError'
import { useContentGraphQlClient } from './useContentGraphQlClient'
import { useProjectAndStage } from './useProjectAndStage'

export const useCurrentContentGraphQlClient = () => {
	const projectAndStage = useProjectAndStage()

	if (projectAndStage === undefined) {
		throw new ApiClientError()
	}
	return useContentGraphQlClient(projectAndStage.project, projectAndStage.stage)
}
