import { useContentGraphQlClient } from './useContentGraphQlClient'
import { useProjectAndStage } from './useProjectAndStage'

export const useCurrentContentGraphQlClient = () => {
	const projectAndStage = useProjectAndStage()
	const potentiallyInvalidClient = useContentGraphQlClient(
		projectAndStage ? projectAndStage.project : '',
		projectAndStage ? projectAndStage.stage : '',
	)

	if (projectAndStage === undefined) {
		return undefined
	}
	return potentiallyInvalidClient
}
