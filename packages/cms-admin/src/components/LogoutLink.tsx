import * as React from 'react'
import { connect } from 'react-redux'
import { logout } from '../actions/auth'
import { Dispatch } from '../actions/types'
import State from '../state'

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
	onClick = async () => {
		if (navigator.credentials && navigator.credentials.preventSilentAccess) {
			await navigator.credentials.preventSilentAccess()
		}

		this.props.logout()
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
	(dispatch: Dispatch, ownProps) => ({ logout: () => dispatch(logout()) }),
)(LogoutLink)
