import * as React from 'react'
import { useDispatch } from 'react-redux'
import { pushRequest } from '../../actions/request'
import { RequestChange } from '../../state/request'

export const useRedirect = () => {
	const dispatch = useDispatch()

	return React.useCallback(
		(requestChange: RequestChange) => {
			dispatch(pushRequest(requestChange))
		},
		[dispatch],
	)
}
