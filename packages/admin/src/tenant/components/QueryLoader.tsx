import { FC, ReactElement } from 'react'
import { QueryRequestState, RequestStateOk } from '../hooks'
import { ContainerSpinner } from '@contember/ui'

export function QueryLoader<Result>({ query, children }: { query: QueryRequestState<Result>, children: FC<{ query: RequestStateOk<Result> }> }): ReactElement | null {
	if (query.state === 'error') {
		return <>Error loading data</>
	}
	if (query.state === 'loading') {
		return <ContainerSpinner />
	}
	return children({ query })
}
