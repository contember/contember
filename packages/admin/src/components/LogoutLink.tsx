import { Component as ReactComponent, ComponentType, FunctionComponent } from 'react'
import { connect } from 'react-redux'
import { logout } from '../actions/auth'
import type { Dispatch } from '../actions/types'
import type State from '../state'

interface InnerProps {
	onClick: () => void
}

interface LogoutLinkProps {
	Component?: ComponentType<InnerProps>
}

interface LogoutDispatchProps {
	logout: () => void
}

type Props = LogoutDispatchProps & LogoutLinkProps

class LogoutLink extends ReactComponent<Props, {}> {
	onClick = async () => {
		if (navigator.credentials && navigator.credentials.preventSilentAccess) {
			await navigator.credentials.preventSilentAccess()
		}

		this.props.logout()
	}

	defaultComponent: FunctionComponent<InnerProps> = () => (
		<a href="#" onClick={this.props.logout}>
			{this.props.children}
		</a>
	)

	override render() {
		const Component = this.props.Component || this.defaultComponent
		return <Component onClick={this.onClick} />
	}
}

export default connect<{}, LogoutDispatchProps, LogoutLinkProps, State>(null, (dispatch: Dispatch, ownProps) => ({
	logout: () => dispatch(logout()),
}))(LogoutLink)
