import { BoxContent, ContainerSpinner } from '@contember/ui'
import { FC, ReactElement } from 'react'
import { QueryRequestState, RequestStateOk } from '../lib'

export function QueryLoader<Result>({ query, children }: { query: QueryRequestState<Result>, children: FC<{ query: RequestStateOk<Result> }> }): ReactElement | null {
	if (query.state === 'error') {
		return <BoxContent intent="danger">Error loading data</BoxContent>
	}
	if (query.state === 'loading') {
		return <ContainerSpinner />
	}
	return children({ query })
}
