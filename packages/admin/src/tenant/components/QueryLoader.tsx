import { Box, SpinnerOverlay } from '@contember/ui'
import { FC, ReactElement } from 'react'
import { QueryRequestState, RequestStateOk } from '../lib'

export function QueryLoader<Result>({ query, children }: { query: QueryRequestState<Result>, children: FC<{ query: RequestStateOk<Result> }> }): ReactElement | null {
	if (query.state === 'error') {
		return <Box intent="danger">Error loading data</Box>
	}
	if (query.state === 'loading') {
		return <SpinnerOverlay />
	}
	return children({ query })
}
