import { ClientError } from './ClientError'
import { useContentGraphQlClient } from './useContentGraphQlClient'
import { useProjectAndStage } from './project'

export const useCurrentContentGraphQlClient = () => {
	const projectAndStage = useProjectAndStage()

	if (projectAndStage === undefined) {
		throw new ClientError()
	}
	return useContentGraphQlClient(projectAndStage.project, projectAndStage.stage)
}
