import * as React from 'react'
import RequestState, { RequestChange } from '../../state/request'
import { buildUrlFromRequest } from '../../utils/url'
import { connect } from 'react-redux'
import State from '../../state'
import { Dispatch } from '../../actions/types'
import { pushRequest } from '../../actions/request'

class Link extends React.PureComponent<Link.Props, Link.State> {
	onClick: React.MouseEventHandler = e => {
		e.preventDefault()
		this.props.goTo()
	}

	defaultComponent: React.StatelessComponent<Link.InnerProps> = () => (
		<a href={this.props.url} onClick={this.onClick}>
			{this.props.children}
		</a>
	)

	render() {
		const Component = this.props.Component || this.defaultComponent
		return <Component href={this.props.url} onClick={this.onClick} />
	}
}

namespace Link {
	export interface InnerProps {
		href: string
		onClick: React.MouseEventHandler
	}

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
	({ view }, { requestChange }) => ({
		url: buildUrlFromRequest(requestChange())
	}),
	(dispatch: Dispatch, { requestChange }) => ({ goTo: () => dispatch(pushRequest(requestChange)) })
)(Link)
