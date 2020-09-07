import { diffQuery, DiffQueryResponse, TreeFilter } from '@contember/client'
import * as React from 'react'
import { ApiRequestState } from '../apiRequest'
import { useSessionToken } from '../auth'
import { useStageSlug } from '../project'
import { useSystemApiRequest } from './useSystemApiRequest'

export const useDiffQuery = (): [
	ApiRequestState<DiffQueryResponse>,
	(treeFilter: TreeFilter[]) => Promise<DiffQueryResponse>,
] => {
	const [requestState, sendRequest] = useSystemApiRequest<DiffQueryResponse>()
	const stage = useStageSlug()
	const sessionToken = useSessionToken()
	const sendQuery = React.useCallback(
		(treeFilter: TreeFilter[]) =>
			sendRequest(
				diffQuery,
				{
					stage,
					filter: treeFilter,
				},
				sessionToken,
			),
		[sessionToken, stage, sendRequest],
	)

	return [requestState, sendQuery]
}
