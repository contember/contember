import { releaseTreeMutation, ReleaseTreeMutationResponse, TreeFilter } from '@contember/client'
import * as React from 'react'
import { ApiRequestState } from '../apiRequest'
import { useSessionToken } from '../auth'
import { useStageSlug } from '../project'
import { useSystemApiRequest } from './useSystemApiRequest'

export const useReleaseTreeMutation = (): [
	ApiRequestState<ReleaseTreeMutationResponse>,
	(treeFilter: TreeFilter[]) => Promise<ReleaseTreeMutationResponse>,
] => {
	const [requestState, sendRequest] = useSystemApiRequest<ReleaseTreeMutationResponse>()
	const stage = useStageSlug()
	const sessionToken = useSessionToken()
	const sendMutation = React.useCallback(
		(treeFilter: TreeFilter[]) =>
			sendRequest(
				releaseTreeMutation,
				{
					stage,
					filter: treeFilter,
				},
				sessionToken,
			),
		[sessionToken, stage, sendRequest],
	)

	return [requestState, sendMutation]
}
