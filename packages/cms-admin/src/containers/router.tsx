import * as React from 'react'
import { connect } from 'react-redux'
import State from '../state'
import RequestState, { loginRequest, dashboardRequest } from '../state/request'
import Link from '../components/Link'
import Login from '../components/Login'

type RouteName = RequestState['name']
type RequestByName<K extends RouteName, T = RequestState> = T extends { name: K } ? T : never
type RouteHandler<K extends RouteName> = (route: RequestByName<K>) => React.ReactNode
type RouteMap<N extends RouteName = RouteName> = { [K in N]: RouteHandler<K> }

const routeMap: RouteMap = {
	login: route => <Login />,
	entity_edit: route => `This is an ${route.name}.`,
	dashboard: route => `This is a ${route.name}.`,
	entity_list: route => `This is an ${route.name} ${route}.`
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
				<Link requestChange={dashboardRequest('foo')}>Dashboard</Link>
			</div>
			{loading && <div>Loading overlay</div>}
			<div>{route && renderRoute(route)}</div>
		</div>
	)
})
