import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { pushRequest } from '../../actions/request'
import { PageChange } from '../../components/pageRouting/PageLink'
import routes from '../../routes'
import State from '../../state'
import { RequestChange } from '../../state/request'
import { requestStateToPath, RouteMap } from '../../utils/url'

interface UseLinkReturn {
	goTo: () => void
	href: string
}

export const useLink = (requestChange: RequestChange): UseLinkReturn => {
	const routeMap = useSelector<State, RouteMap>(({ projectsConfigs }) => {
		return routes(projectsConfigs.configs)
	})
	const request = useSelector<State, State['request']>(({ request }) => {
		return request
	})
	const href = useMemo(() => {
		return requestStateToPath(routeMap, requestChange(request))
	}, [request, requestChange, routeMap])

	const dispatch = useDispatch()
	const goTo = useCallback(() => {
		dispatch(pushRequest(requestChange))
	}, [dispatch, requestChange])

	return { href, goTo }
}

export const usePageLink = (pageChange: PageChange | string): UseLinkReturn => {
	const realPageChange = useMemo((): PageChange => {
		return typeof pageChange === 'string' ? () => ({ name: pageChange }) : pageChange
	}, [pageChange])

	const requestChange = useCallback(
		currentState => {
			if (currentState.name === 'project_page') {
				const target = realPageChange()
				return {
					...currentState,
					pageName: target.name,
					parameters: target.params,
				}
			}
			return currentState
		},
		[realPageChange],
	)

	return useLink(requestChange)
}
