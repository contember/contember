import { Button, ErrorList, FormGroup, TextInput } from '@contember/ui'
import * as React from 'react'
import { connect } from 'react-redux'
import { login, tryAutoLogin } from '../../actions/auth'
import { Dispatch } from '../../actions/types'
import State from '../../state'
import { AuthStatus } from '../../state/auth'
import { MiscPageLayout } from '../MiscPageLayout'

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
			<MiscPageLayout heading="Contember CMS">
				<form
					onSubmit={async e => {
						e.preventDefault()
						await this.props.login(this.state.email, this.state.password, this.state.rememberMe)
					}}
				>
					{this.props.errorMessage && (
						<>
							<ErrorList size="large" errors={[{ message: this.props.errorMessage }]} />
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
			</MiscPageLayout>
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
