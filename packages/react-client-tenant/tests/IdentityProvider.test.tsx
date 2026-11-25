import { afterAll, afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { GraphQlClient, GraphQlClientOptions } from '@contember/graphql-client'
import { ApiBaseUrlContext, GraphQlClientFactoryContext, SessionTokenContext, SetSessionTokenContext } from '@contember/react-client'
import { ReactNode, useEffect, useState } from 'react'
import { IdentityProvider } from '../src/components/IdentityProvider.js'
import { LoginForm, useLoginForm } from '../src/components/forms/LoginForm.js'
import { useIdentityState } from '../src/contexts.js'

type Fetcher = (input: RequestInfo, init?: RequestInit) => Promise<Response>

const jsonResponse = (body: unknown) => new Response(JSON.stringify({ data: body }), { headers: { 'Content-Type': 'application/json' } })

const meResponse = jsonResponse({
	me: { id: 'identity-1', roles: [], person: null, projects: [], permissions: null },
})

const ClientProvider = ({ fetcher, initialToken, children }: { fetcher: Fetcher; initialToken?: string; children: ReactNode }) => {
	const [token, setToken] = useState(initialToken)
	const [clientFactory] = useState(() => (options: GraphQlClientOptions) => new GraphQlClient({ ...options, fetcher }))
	return (
		<ApiBaseUrlContext.Provider value="http://localhost">
			<GraphQlClientFactoryContext.Provider value={clientFactory}>
				<SessionTokenContext.Provider value={{ token, propsToken: undefined, source: undefined }}>
					<SetSessionTokenContext.Provider value={setToken}>
						{children}
					</SetSessionTokenContext.Provider>
				</SessionTokenContext.Provider>
			</GraphQlClientFactoryContext.Provider>
		</ApiBaseUrlContext.Provider>
	)
}

const IdentityStateProbe = () => <span data-testid="identity-state">{useIdentityState()}</span>

const consoleError = spyOn(console, 'error').mockImplementation(() => {})

beforeEach(() => {
	consoleError.mockClear()
})

afterEach(cleanup)

afterAll(() => {
	consoleError.mockRestore()
})

describe('IdentityProvider', () => {
	it('logs a failed identity query and reports the identity as failed', async () => {
		const failure = new TypeError('Failed to fetch')
		const { findByText } = render(
			<ClientProvider initialToken="session-token" fetcher={async () => Promise.reject(failure)}>
				<IdentityProvider>
					<IdentityStateProbe />
				</IdentityProvider>
			</ClientProvider>,
		)
		expect(await findByText('failed')).toBeTruthy()
		expect(consoleError).toHaveBeenCalledTimes(1)
	})

	it('does not log an aborted identity query and keeps the identity loading', async () => {
		let requests = 0
		const fetcher: Fetcher = async () => {
			requests++
			throw new DOMException('The operation was aborted.', 'AbortError')
		}
		const { getByTestId } = render(
			<ClientProvider initialToken="session-token" fetcher={fetcher}>
				<IdentityProvider>
					<IdentityStateProbe />
				</IdentityProvider>
			</ClientProvider>,
		)
		await waitFor(() => expect(requests).toBe(1))
		// Let the rejection settle before asserting nothing happened.
		await act(async () => {})
		expect(getByTestId('identity-state').textContent).toBe('loading')
		expect(consoleError).not.toHaveBeenCalled()
	})
})

const FillCredentials = () => {
	const { setValues } = useLoginForm()
	useEffect(() => {
		setValues({ email: 'user@example.com', password: 'secret-password', otpToken: '', backupCode: '' })
	}, [setValues])
	return null
}

describe('LoginForm redirecting to the backlink', () => {
	afterEach(() => {
		window.happyDOM.setURL('about:blank')
	})

	it('aborts the identity query the new session token starts', async () => {
		window.happyDOM.setURL('http://localhost/?backlink=%2Fapp%2F')
		const meSignals: (AbortSignal | null | undefined)[] = []
		const fetcher: Fetcher = async (_input, init) => {
			const { query } = JSON.parse(String(init?.body))
			if (query.includes('signIn')) {
				return jsonResponse({
					mutation: { ok: true, error: null, result: { token: 'session-token', person: { id: 'person-1', email: 'user@example.com', name: null } } },
				})
			}
			meSignals.push(init?.signal)
			if (init?.signal?.aborted) {
				throw new DOMException('The operation was aborted.', 'AbortError')
			}
			return meResponse
		}
		const { getByText, getByTestId } = render(
			<ClientProvider fetcher={fetcher}>
				<IdentityProvider>
					<IdentityStateProbe />
					<LoginForm>
						<form>
							<FillCredentials />
							<button type="submit">sign in</button>
						</form>
					</LoginForm>
				</IdentityProvider>
			</ClientProvider>,
		)
		fireEvent.click(getByText('sign in'))

		await waitFor(() => expect(meSignals).toHaveLength(1))
		await act(async () => {})
		expect(window.location.href).toBe('http://localhost/app/')
		expect(meSignals[0]?.aborted).toBe(true)
		expect(getByTestId('identity-state').textContent).toBe('loading')
		expect(consoleError).not.toHaveBeenCalled()
	})
})
