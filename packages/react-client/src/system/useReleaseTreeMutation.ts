import { releaseTreeMutation, ReleaseTreeMutationResponse, TreeFilter } from '@contember/client'
import * as React from 'react'
import { ApiRequestState } from '../apiRequest'
import { useStageSlug } from '../project'
import { useSystemApiRequest } from './useSystemApiRequest'

export const useReleaseTreeMutation = (): [
	ApiRequestState<ReleaseTreeMutationResponse>,
	(treeFilter: TreeFilter[]) => Promise<ReleaseTreeMutationResponse>,
] => {
	const [requestState, sendRequest] = useSystemApiRequest<ReleaseTreeMutationResponse>()
	const stage = useStageSlug()
	const sendMutation = React.useCallback(
		(treeFilter: TreeFilter[]) =>
			sendRequest(releaseTreeMutation, {
				stage,
				filter: treeFilter,
			}),
		[stage, sendRequest],
	)

	return [requestState, sendMutation]
}
