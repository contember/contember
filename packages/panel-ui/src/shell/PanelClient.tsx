import { GraphQlClient, type GraphQlClientOptions, type GraphQlClientRequestOptions } from '@contember/graphql-client'
import {
	ApiBaseUrlContext,
	type GraphQlClientFactory,
	GraphQlClientFactoryContext,
	SessionTokenContext,
	type SessionTokenContextValue,
	SetSessionTokenContext,
} from '@contember/react-client'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { isPanelAccessDenied } from './accessDenied.js'

/**
 * The panel owns its session key. `ContemberClient` hardcodes `contember_session_token`, which an
 * app served from the same origin also uses — the two must not overwrite each other.
 */
const sessionTokenKey = 'contember_panel_session_token'

/** Reports a panel denial once, so the shell can swap the whole UI for the denial screen. */
class PanelGraphQlClient extends GraphQlClient {
	constructor(
		options: GraphQlClientOptions,
		private readonly onAccessDenied: () => void,
	) {
		super(options)
	}

	override async execute<T = unknown>(query: string, options: GraphQlClientRequestOptions = {}): Promise<T> {
		try {
			return await super.execute<T>(query, options)
		} catch (error) {
			if (isPanelAccessDenied(error)) {
				this.onAccessDenied()
			}
			throw error
		}
	}
}

export interface PanelClientProps {
	apiBaseUrl: string
	onAccessDenied: () => void
	children: ReactNode
}

/**
 * What `ContemberClient` does, minus the shared session key and minus the login token.
 *
 * No `LoginTokenContext`: the engine fills the `Authorization` header in for unauthenticated
 * `/panel/api` calls, so the login token never has to reach the browser.
 */
export const PanelClient = ({ apiBaseUrl, onAccessDenied, children }: PanelClientProps) => {
	const [sessionToken, setSessionTokenState] = useState(() => localStorage.getItem(sessionTokenKey) ?? undefined)

	const setSessionToken = useCallback((token: string | undefined) => {
		if (token === undefined) {
			localStorage.removeItem(sessionTokenKey)
		} else {
			localStorage.setItem(sessionTokenKey, token)
		}
		setSessionTokenState(token)
	}, [])

	const sessionTokenValue = useMemo((): SessionTokenContextValue => ({
		propsToken: undefined,
		token: sessionToken,
		source: sessionToken === undefined ? undefined : 'localstorage',
	}), [sessionToken])

	const clientFactory = useMemo(
		(): GraphQlClientFactory => options => new PanelGraphQlClient(options, onAccessDenied),
		[onAccessDenied],
	)

	return (
		<ApiBaseUrlContext.Provider value={apiBaseUrl}>
			<SetSessionTokenContext.Provider value={setSessionToken}>
				<SessionTokenContext.Provider value={sessionTokenValue}>
					<GraphQlClientFactoryContext.Provider value={clientFactory}>
						{children}
					</GraphQlClientFactoryContext.Provider>
				</SessionTokenContext.Provider>
			</SetSessionTokenContext.Provider>
		</ApiBaseUrlContext.Provider>
	)
}
