import * as React from 'react'
import { ProjectAndStage } from './ProjectAndStage'
import { useProjectSlug } from './useProjectSlug'
import { useStageSlug } from './useStageSlug'

export const useProjectAndStage = (): ProjectAndStage | undefined => {
	const project = useProjectSlug()
	const stage = useStageSlug()

	return React.useMemo(() => {
		if (project === undefined || stage === undefined) {
			return undefined
		}
		return {
			project,
			stage,
		}
	}, [project, stage])
}
