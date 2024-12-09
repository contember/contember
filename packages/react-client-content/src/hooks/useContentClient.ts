import { ContentClient, useCurrentContentGraphQlClient } from '@contember/react-client'
import { useMemo } from 'react'

export const useContentClient = () => {
	const contentClient = useCurrentContentGraphQlClient()
	return useMemo(() => new ContentClient(contentClient), [contentClient])
}
