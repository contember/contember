import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { pushRequest } from '../../actions/request'
import type { RequestChange } from '../../state/request'

export const useRedirect = () => {
	const dispatch = useDispatch()

	return useCallback(
		(requestChange: RequestChange) => {
			dispatch(pushRequest(requestChange))
		},
		[dispatch],
	)
}
