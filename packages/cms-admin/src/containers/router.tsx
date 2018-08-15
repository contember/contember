import * as React from 'react'
import { connect } from 'react-redux'
import State from '../state'
import RequestState from '../state/request'

type RouteName = RequestState['name']
type RequestByName<K extends RouteName, T = RequestState> = T extends { name: K } ? T : never
type RouteHandler<K extends RouteName> = (route: RequestByName<K>) => React.ReactNode
type RouteMap<N extends RouteName = RouteName> = { [K in N]: RouteHandler<K> }

function getHandler<N extends RouteName>(routeMap: RouteMap, name: N): RouteHandler<N> {
	return routeMap[name] as RouteHandler<N>
}

function renderRoute(routeMap: RouteMap, route: RequestState): React.ReactNode {
	const handler = getHandler(routeMap, route.name)
	return handler ? handler(route) : '404'
}

export default connect<{ loading: boolean; route: RequestState | null }, {}, { routes: RouteMap }, State>(
	({ view: { loading, route } }) => ({
		loading,
		route
	})
)(({ loading, route, routes }) => <>{route && renderRoute(routes, route)}</>)
