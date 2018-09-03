import * as React from 'react'
import { connect } from 'react-redux'
import State from '../state'
import { Dispatch } from '../actions/types'
import { logout } from '../actions/auth'

interface InnerProps {
	onClick: () => void
}

interface LogoutLinkProps {
	Component?: React.ComponentType<InnerProps>
}

interface LogoutDispatchProps {
	logout: () => void
}

type Props = LogoutDispatchProps & LogoutLinkProps

class LogoutLink extends React.Component<Props, {}> {
	onClick = () => {
		// this.props
	}

	defaultComponent: React.StatelessComponent<InnerProps> = () => (
		<a href="#" onClick={this.props.logout}>
			{this.props.children}
		</a>
	)

	render() {
		const Component = this.props.Component || this.defaultComponent
		return <Component onClick={this.onClick} />
	}
}

export default connect<{}, LogoutDispatchProps, LogoutLinkProps, State>(
	null,
	(dispatch: Dispatch, ownProps) => ({ logout: () => dispatch(logout()) })
)(LogoutLink)
