import { diffQuery, DiffQueryResponse, TreeFilter } from '@contember/client'
import * as React from 'react'
import { ApiRequestState } from '../apiRequest'
import { useStageSlug } from '../project'
import { useSystemApiRequest } from './useSystemApiRequest'

export const useDiffQuery = (): [
	ApiRequestState<DiffQueryResponse>,
	(treeFilter: TreeFilter[]) => Promise<DiffQueryResponse>,
] => {
	const [requestState, sendRequest] = useSystemApiRequest<DiffQueryResponse>()
	const stage = useStageSlug()
	const sendQuery = React.useCallback(
		(treeFilter: TreeFilter[]) =>
			sendRequest(diffQuery, {
				stage,
				filter: treeFilter,
			}),
		[stage, sendRequest],
	)

	return [requestState, sendQuery]
}
