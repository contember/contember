import { useCallback } from 'react'
import type { RequestChange } from '../../state/request'
import { useLinkFactory } from '../Link/useLink'

export const useRedirect = () => {
	const linkFactory = useLinkFactory()
	return useCallback(
		(requestChange: RequestChange) => {
			linkFactory(requestChange).navigate()
		},
		[linkFactory],
	)
}
