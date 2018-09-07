import * as React from 'react'
import { RequestChange } from '../../state/request'
import { requestStateToPath } from '../../utils/url'
import { connect } from 'react-redux'
import State from '../../state'
import { Dispatch } from '../../actions/types'
import { pushRequest } from '../../actions/request'
import routes from '../../routes'

class Link extends React.PureComponent<Link.Props, Link.State> {
	onClick: React.MouseEventHandler = e => {
		e.preventDefault()
		this.props.goTo()
	}

	defaultComponent: React.StatelessComponent<InnerProps> = () => (
		<a href={this.props.url} onClick={this.onClick}>
			{this.props.children}
		</a>
	)

	render() {
		const Component = this.props.Component || this.defaultComponent
		return <Component href={this.props.url} onClick={this.onClick} />
	}
}

export interface InnerProps {
	href: string
	onClick: React.MouseEventHandler
}

namespace Link {
	export interface OwnProps {
		requestChange: RequestChange
		Component?: React.ComponentType<InnerProps>
	}

	export interface DispatchProps {
		goTo: () => void
	}

	export interface StateProps {
		url: string
	}

	export type Props = StateProps & DispatchProps & OwnProps

	export interface State {}
}

export default connect<Link.StateProps, Link.DispatchProps, Link.OwnProps, State>(
	({ view, projectsConfigs }, { requestChange }) => ({
		url: requestStateToPath(routes(projectsConfigs.configs), requestChange())
	}),
	(dispatch: Dispatch, { requestChange }) => ({ goTo: () => dispatch(pushRequest(requestChange)) })
)(Link)
