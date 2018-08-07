import * as React from 'react'
import { InputGroup, FormGroup, Card, Elevation, H1, Button } from '@blueprintjs/core'
import { LoginModel } from '../../model/LoginModel'

interface State {
	email: string
	password: string
	loading: boolean
	error: boolean
	message?: string
}

export default class Login extends React.Component<{}, State> {
	state: State = {
		email: '',
		password: '',
		loading: false,
		error: false
	}

	loginModel = LoginModel.create()

	render() {
		return (
			<Card elevation={Elevation.ONE}>
				<H1>Login</H1>
				<form
					onSubmit={async e => {
						e.preventDefault()
						this.setState({ loading: true })
						const result = await this.loginModel.logIn(this.state.email, this.state.password)
						this.setState({ loading: false, error: !result.ok, message: result.message })
					}}
				>
					{this.state.message}
					<FormGroup label="Email">
						<InputGroup
							value={this.state.email}
							autoComplete="username"
							type="email"
							disabled={this.state.loading}
							onChange={(e: React.FormEvent<HTMLInputElement>) => this.setState({ email: e.currentTarget.value })}
						/>
					</FormGroup>
					<FormGroup label="Password">
						<InputGroup
							type="password"
							autoComplete="current-password"
							value={this.state.password}
							disabled={this.state.loading}
							onChange={(e: React.FormEvent<HTMLInputElement>) => this.setState({ password: e.currentTarget.value })}
						/>
					</FormGroup>
					<Button type="submit" loading={this.state.loading}>
						Login
					</Button>
				</form>
			</Card>
		)
	}
}
