import * as React from 'react'
import { InputGroup, FormGroup, Card, Elevation, H1, Button, Checkbox, Callout } from '@blueprintjs/core'
import { connect } from 'react-redux'
import { login } from '../../actions/auth'
import State from '../../state'
import { Dispatch } from '../../actions/types'
import { AuthStatus } from '../../state/auth'

class Login extends React.PureComponent<Login.Props, Login.State> {
	state: Login.State = {
		email: '',
		password: '',
		rememberMe: false
	}

	render() {
		const loading = this.props.status === AuthStatus.LOADING

		return (
			<div className="login-wrap">
				<Card elevation={Elevation.ONE} className="login-card">
					<div className="login-site">
						<img src="https://www.mangoweb.cz/images/logo.png" className="login-siteLogo" />
						<h1 className="login-siteName">manGoweb CMS</h1>
					</div>
					<form
						onSubmit={async e => {
							e.preventDefault()
							await this.props.login(this.state.email, this.state.password)
						}}
					>
						{this.props.errorMessage && (
							<Callout intent="danger" icon={null}>
								{this.props.errorMessage}
							</Callout>
						)}
						<FormGroup label="Email">
							<InputGroup
								value={this.state.email}
								autoComplete="username"
								type="email"
								disabled={loading}
								onChange={(e: React.FormEvent<HTMLInputElement>) => this.setState({ email: e.currentTarget.value })}
							/>
						</FormGroup>
						<FormGroup label="Password">
							<InputGroup
								type="password"
								autoComplete="current-password"
								value={this.state.password}
								disabled={loading}
								onChange={(e: React.FormEvent<HTMLInputElement>) => this.setState({ password: e.currentTarget.value })}
							/>
						</FormGroup>
						<Checkbox
							disabled={loading}
							checked={this.state.rememberMe}
							onChange={(e: React.FormEvent<HTMLInputElement>) =>
								this.setState({ rememberMe: e.currentTarget.checked })
							}
						>
							Remember me
						</Checkbox>
						<Button type="submit" loading={loading} intent="primary">
							Login
						</Button>
					</form>
				</Card>
			</div>
		)
	}
}

namespace Login {
	export interface DispatchProps {
		login: (email: string, password: string) => void
	}

	export interface StateProps {
		errorMessage: string | null
		status: AuthStatus | null
	}

	export type Props = DispatchProps & StateProps

	export interface State {
		email: string
		password: string
		rememberMe: boolean
	}
}

export default connect<Login.StateProps, Login.DispatchProps, {}, State>(
	({ auth }) => ({ errorMessage: auth.errorMessage, status: auth.status }),
	(dispatch: Dispatch) => ({
		login: (email: string, password: string) => dispatch(login(email, password))
	})
)(Login)
