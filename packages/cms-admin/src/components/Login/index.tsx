import * as React from 'react'
import { InputGroup, FormGroup, Card, Elevation, H1, Button } from '@blueprintjs/core'
import { connect } from 'react-redux'
import { login } from '../../actions/auth'
import State from '../../state'
import { Dispatch } from '../../actions/types'
import { AuthStatus } from '../../state/auth'

class Login extends React.PureComponent<Login.Props, Login.State> {
	state: Login.State = {
		email: '',
		password: ''
	}

	render() {
		const loading = this.props.status === AuthStatus.LOADING

		return (
			<Card elevation={Elevation.ONE}>
				<H1>Login</H1>
				<form
					onSubmit={async e => {
						e.preventDefault()
						await this.props.login(this.state.email, this.state.password)
					}}
				>
					{this.props.errorMessage}
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
					<Button type="submit" loading={loading}>
						Login
					</Button>
				</form>
			</Card>
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
	}
}

export default connect<Login.StateProps, Login.DispatchProps, {}, State>(
	({ auth }) => ({ errorMessage: auth.errorMessage, status: auth.status }),
	(dispatch: Dispatch) => ({
		login: (email: string, password: string) => dispatch(login(email, password))
	})
)(Login)
