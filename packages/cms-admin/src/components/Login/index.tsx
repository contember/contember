import { Callout, Card, Elevation } from '@blueprintjs/core'
import { Button } from '@contember/ui'
import { FormGroup, InputGroup } from '..'
import * as React from 'react'
import { connect } from 'react-redux'
import { login, tryAutoLogin } from '../../actions/auth'
import { Dispatch } from '../../actions/types'
import State from '../../state'
import { AuthStatus } from '../../state/auth'
import cn from 'classnames'

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

						<div className={cn('formGroup')}>
							<label className="formGroup-label">
								<input
									type="checkbox"
									checked={this.state.rememberMe}
									value={this.state.password}
									disabled={loading}
									onChange={(e: React.FormEvent<HTMLInputElement>) =>
										this.setState({ rememberMe: e.currentTarget.checked })
									}
								/>
								Remember me
							</label>
						</div>
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
