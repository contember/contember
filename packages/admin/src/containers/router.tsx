import { FunctionComponent, PureComponent } from 'react'
import { connect } from 'react-redux'
import type State from '../state'
import type RequestState from '../state/request'

type RouteName = RequestState['name']
type RequestByName<K extends RouteName, T = RequestState> = T extends { name: K } ? T : never
type RouteHandler<K extends RouteName> = FunctionComponent<{ route: RequestByName<K> }>
type RouteMap<N extends RouteName = RouteName> = { [K in N]: RouteHandler<K> }

interface RoutesRendererStateProps {
	request: RequestState
}

interface RoutesRendererOwnProps {
	routes: RouteMap
}

type RoutesRendererProps = RoutesRendererStateProps & RoutesRendererOwnProps

class RoutesRenderer extends PureComponent<RoutesRendererProps> {
	public override render() {
		const route = this.props.request
		const Handler = this.props.routes[route.name] as RouteHandler<RouteName>
		return Handler ? <Handler route={route} /> : '404'
	}
}

export const Router = connect<RoutesRendererStateProps, {}, RoutesRendererOwnProps, State>(
	({ request }) => ({ request }),
)(RoutesRenderer)
