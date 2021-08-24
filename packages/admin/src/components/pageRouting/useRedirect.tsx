import { useCallback } from 'react'
import type { RequestChange } from '../../routing'
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
