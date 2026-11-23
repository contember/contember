import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { cleanup, render, within } from '@testing-library/react'
import { GraphQlClient, GraphQlClientOptions } from '@contember/graphql-client'
import { ApiBaseUrlContext, GraphQlClientFactoryContext, LoginTokenContext } from '@contember/react-client'
import { ReactNode } from 'react'
import { IdentityProviderList } from '../src/config/identity-provider-list.js'
import { TenantConfigView } from '../src/config/tenant-config-view.js'

const rateLimitWindow = { limit: 10, window: 'PT1H' }

const configuration = {
	signup: { requireEmailVerification: false },
	emailChange: { requireVerification: false, requireReauthentication: true },
	passwordless: { enabled: 'optIn', url: null, expiration: 'PT15M', uniformResponse: true },
	password: {
		minLength: 8,
		requireUppercase: 0,
		requireLowercase: 0,
		requireDigit: 0,
		requireSpecial: 0,
		pattern: null,
		checkBlacklist: true,
		checkHibp: false,
		revokeSessionsOnChange: false,
	},
	login: {
		baseBackoff: 'PT1S',
		maxBackoff: 'PT1H',
		attemptWindow: 'PT10M',
		revealUserExists: true,
		revealLoginMethod: true,
		defaultTokenExpiration: 'PT30M',
		maxTokenExpiration: null,
		mfaGraceDuration: 'P0D',
		mfaChangeRequiresReauthentication: true,
		anomalyDetection: { enabled: false, historySize: 10, emailThreshold: 5, stepUpThreshold: 8, missingSignalIsNew: true },
	},
	captcha: {
		provider: null,
		threshold: null,
		protect: { signUp: false, passwordReset: false, passwordlessInit: false, emailVerification: false },
	},
	rateLimits: {
		signUpPerIp: rateLimitWindow,
		loginPerIp: rateLimitWindow,
		passwordResetPerIp: rateLimitWindow,
		passwordlessInitPerIp: rateLimitWindow,
		emailOtpPerPerson: rateLimitWindow,
		emailVerificationPerIp: rateLimitWindow,
	},
	panel: { globalRoles: ['super_admin'], projectRoles: ['admin'] },
}

const identityProviders = [
	{ slug: 'strict', type: 'oidc', disabledAt: null, configuration: { url: 'https://idp.test', strictResponseType: true }, options: {} },
	{ slug: 'lenient', type: 'oidc', disabledAt: null, configuration: { url: 'https://idp.test' }, options: {} },
	{ slug: 'apple', type: 'apple', disabledAt: null, configuration: {}, options: {} },
]

const requestedQueries: string[] = []

beforeEach(() => {
	requestedQueries.length = 0
})

afterEach(cleanup)

const tenantApi = async (_input: RequestInfo, init?: RequestInit): Promise<Response> => {
	const { query }: { query: string } = JSON.parse(String(init?.body))
	requestedQueries.push(query)
	const data = query.includes('identityProviders') ? { identityProviders } : { configuration }
	return new Response(JSON.stringify({ data }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

const clientFactory = (options: GraphQlClientOptions) => new GraphQlClient({ ...options, fetcher: tenantApi })

const wrapper = ({ children }: { children: ReactNode }) => (
	<ApiBaseUrlContext.Provider value="http://localhost">
		<LoginTokenContext.Provider value="login-token">
			<GraphQlClientFactoryContext.Provider value={clientFactory}>
				{children}
			</GraphQlClientFactoryContext.Provider>
		</LoginTokenContext.Provider>
	</ApiBaseUrlContext.Provider>
)

const settingValue = async (container: HTMLElement, section: string, setting: string): Promise<string | null> => {
	const heading = await within(container).findByText(section, { selector: 'h3' })
	const row = within(heading.parentElement ?? container).getByText(setting).closest('tr')
	return row?.querySelectorAll('td')[1]?.textContent ?? null
}

describe('TenantConfigView', () => {
	test('shows the session-revocation, re-authentication and uniform-response settings next to their siblings', async () => {
		const { container } = render(<TenantConfigView />, { wrapper })

		expect(await settingValue(container, 'E-mail change', 'requireReauthentication')).toBe('Enabled')
		expect(await settingValue(container, 'Password policy', 'revokeSessionsOnChange')).toBe('Disabled')
		expect(await settingValue(container, 'Passwordless sign-in', 'uniformResponse')).toBe('Enabled')
		expect(requestedQueries[0]).toContain('requireReauthentication')
		expect(requestedQueries[0]).toContain('revokeSessionsOnChange')
		expect(requestedQueries[0]).toContain('uniformResponse')
	})

	test('shows the MFA-change re-authentication and missing-signal settings in the login sections', async () => {
		const { container } = render(<TenantConfigView />, { wrapper })

		expect(await settingValue(container, 'Login', 'mfaChangeRequiresReauthentication')).toBe('Enabled')
		expect(await settingValue(container, 'Anomaly detection', 'missingSignalIsNew')).toBe('Enabled')
		expect(requestedQueries[0]).toContain('mfaChangeRequiresReauthentication')
		expect(requestedQueries[0]).toContain('missingSignalIsNew')
	})
})

describe('IdentityProviderList', () => {
	test('shows strictResponseType for oidc providers, off when absent, and not for other handlers', async () => {
		const { findByText } = render(<IdentityProviderList />, { wrapper })
		await findByText('strict')

		const cellUnder = (slug: string): string | null => {
			const headers = Array.from(document.querySelectorAll('th')).map(it => it.textContent)
			const column = headers.indexOf('Strict response type')
			const row = Array.from(document.querySelectorAll('tr')).find(it => it.querySelector('td')?.textContent === slug)
			return row?.querySelectorAll('td')[column]?.textContent ?? null
		}
		expect(cellUnder('strict')).toBe('Enabled')
		expect(cellUnder('lenient')).toBe('Disabled')
		expect(cellUnder('apple')).toBe('—')
	})
})
