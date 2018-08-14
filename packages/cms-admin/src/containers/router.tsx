import * as React from 'react'
import { connect } from 'react-redux'
import State from '../state'
import RequestState, { loginRequest, pageRequest } from '../state/request'
import Link from '../components/Link'
import Login from '../components/Login'

type RouteName = RequestState['name']
type RequestByName<K extends RouteName, T = RequestState> = T extends { name: K } ? T : never
type RouteHandler<K extends RouteName> = (route: RequestByName<K>) => React.ReactNode
type RouteMap<N extends RouteName = RouteName> = { [K in N]: RouteHandler<K> }

const routeMap: RouteMap = {
	login: route => <Login />,
	project_page: route => `This is ${route.pageName} with parameters ${JSON.stringify(route.parameters)}`
}

function getHandler<N extends RouteName>(name: N): RouteHandler<N> {
	return routeMap[name] as RouteHandler<N>
}

function renderRoute(route:RequestState): React.ReactNode {
	const handler = getHandler(route.name)
	return handler ? handler(route) : '404'
}

export default connect<{ loading: boolean; route: RequestState | null }, {}, {}, State>(
	({ view: { loading, route } }) => ({
		loading,
		route
	})
)(({ loading, route }) => {
	return (
		<div>
			<div>
				<Link requestChange={loginRequest()}>Login</Link>
				{` | `}
				<Link requestChange={pageRequest('blog', 'prod', 'foo', {name: 'foornt', test: {test: 'test'}})}>Project page</Link>
			</div>
			{loading && <div>Loading overlay</div>}
			<div>{route && renderRoute(route)}</div>
		</div>
	)
})
