import { request } from './TenantClient'

interface OperationResult {
	ok: boolean
	message?: string
}

export class LoginModel {
	static instance?: LoginModel

	private constructor() {}

	static create() {
		return (LoginModel.instance = LoginModel.instance || new this())
	}

	async logIn(email: string, password: string): Promise<OperationResult> {
		const { signIn } = await request(loginRequest, { email, password })
		if (signIn.ok) {
			window.localStorage.setItem('auth-token', signIn.result.token)
			return { ok: true }
		} else {
			return { ok: false, message: signIn.errors.map((err: any) => err.endUserMessage || err.code).join(', ') }
		}
	}

	async signUp(email: string, password: string): Promise<OperationResult> {
		const { signUp } = await request(singupRequest, { email, password })
		if (signUp.ok) {
			return { ok: true }
		} else {
			return { ok: false, message: signUp.errors.map((err: any) => err.endUserMessage || err.code).join(', ') }
		}
	}
}

const loginRequest = `
	mutation($email: String!, $password: String!) {
		signIn(email: $email, password: $password) {
			ok
			errors {
				endUserMessage
				code
			}
			result {
				token
			}
		}
	}
`

const singupRequest = `
	mutation($email: String!, $password: String!) {
		signUp(email: $email, password: $password) {
			ok
			errors {
				endUserMessage
				code
			}
		}
	}
`
