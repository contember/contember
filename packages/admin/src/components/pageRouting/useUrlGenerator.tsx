import RequestState from '../../state/request'
import { requestStateToPath, useRouting } from '../../routing'
import { useCallback } from 'react'

export const useUrlGenerator = () => {
	const routing = useRouting()

	return useCallback((request: RequestState): string => {
		return requestStateToPath(routing, request)
	}, [routing])
}
