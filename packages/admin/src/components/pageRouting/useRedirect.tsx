import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { pushRequest } from '../../actions'
import type { RequestChange } from '../../state/request'
import { useRouting } from '../../routing'

export const useRedirect = () => {
	const dispatch = useDispatch()
	const routing = useRouting()

	return useCallback(
		(requestChange: RequestChange) => {
			dispatch(pushRequest(routing, requestChange))
		},
		[dispatch, routing],
	)
}
