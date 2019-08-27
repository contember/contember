import { Card, Elevation } from '@blueprintjs/core'
import { Button, FormGroup, TextInput, ErrorList } from '@contember/ui'
import * as React from 'react'
import { connect } from 'react-redux'
import { login, tryAutoLogin } from '../../actions/auth'
import { Dispatch } from '../../actions/types'
import State from '../../state'
import { AuthStatus } from '../../state/auth'

class Login extends React.PureComponent<Login.Props, Login.State> {
	state: Login.State = {
		email: '',
		password: '',
		rememberMe: false,
	}

	componentDidMount() {
		this.props.tryAutoLogin()
	}

	render() {
		const loading = this.props.status === AuthStatus.LOADING

		return (
			<div className="centerCard-wrap">
				<Card elevation={Elevation.ONE} className="centerCard">
					<div className="login-site">
						<h1 className="login-site-name">Contember CMS</h1>
					</div>
					<form
						onSubmit={async e => {
							e.preventDefault()
							await this.props.login(this.state.email, this.state.password, this.state.rememberMe)
						}}
					>
						{this.props.errorMessage && (
							<>
								<ErrorList
									size="large"
									errors={[
										{
											key: '1',
											message: this.props.errorMessage,
										},
									]}
								/>
								<br />
							</>
						)}
						<FormGroup label="Email">
							<TextInput
								value={this.state.email}
								autoComplete="username"
								type="email"
								disabled={loading}
								onChange={e => this.setState({ email: e.target.value })}
							/>
						</FormGroup>
						<FormGroup label="Password">
							<TextInput
								type="password"
								autoComplete="current-password"
								value={this.state.password}
								disabled={loading}
								onChange={e => this.setState({ password: e.target.value })}
							/>
						</FormGroup>

						<FormGroup label="Remember me">
							<input
								type="checkbox"
								checked={this.state.rememberMe}
								value={this.state.password}
								disabled={loading}
								onChange={(e: React.FormEvent<HTMLInputElement>) =>
									this.setState({ rememberMe: e.currentTarget.checked })
								}
							/>
						</FormGroup>
						<Button type="submit" disabled={loading}>
							Submit
						</Button>
					</form>
				</Card>
			</div>
		)
	}
}

namespace Login {
	export interface DispatchProps {
		login: (email: string, password: string, rememberMe: boolean) => void
		tryAutoLogin: () => void
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
		login: (email: string, password: string, rememberMe: boolean) => dispatch(login(email, password, rememberMe)),
		tryAutoLogin: () => dispatch(tryAutoLogin()),
	}),
)(Login)
