import { memo, useCallback, useMemo, useState } from 'react'
import {
	ApiBaseUrlContext,
	GraphQlClientFactoryContext,
	LoginTokenContext,
	ProjectSlugContext,
	SessionTokenContext,
	SetSessionTokenContext,
	StageSlugContext,
} from '../contexts.js'
import { PrimaryReadWindows, PrimaryReadWindowsContext } from '../primaryReadWindows.js'
import { GraphQlClientFactory, SessionTokenContextValue } from '../types/index.js'

export interface ContemberClientProps {
	apiBaseUrl: string
	sessionToken?: string
	loginToken?: string
	project?: string
	stage?: string
	graphqlClientFactory?: GraphQlClientFactory
	/** Read from the primary for this many milliseconds after a Content API mutation. Default: 1000. Zero disables it. */
	primaryReadWindowMs?: number
}

const sessionTokenKey = 'contember_session_token'

/**
 * @group Entrypoints
 */
export const ContemberClient = memo<ContemberClientProps & { children: React.ReactNode }>(function ContemberClient({
	apiBaseUrl,
	children,
	loginToken,
	project,
	sessionToken,
	stage,
	graphqlClientFactory,
	primaryReadWindowMs = 1000,
}) {
	const [localStorageSessionToken, setLocalStorageSessionToken] = useLocalStorageSessionToken()

	const sessionTokenContextValue = useMemo((): SessionTokenContextValue => ({
		propsToken: sessionToken,
		token: localStorageSessionToken ?? sessionToken,
		source: localStorageSessionToken ? 'localstorage' : (sessionToken ? 'props' : undefined),
	}), [localStorageSessionToken, sessionToken])

	const primaryReadWindows = useMemo(
		() => primaryReadWindowMs === 0 ? undefined : new PrimaryReadWindows(primaryReadWindowMs),
		[primaryReadWindowMs],
	)

	return (
		<ApiBaseUrlContext.Provider value={apiBaseUrl}>
			<LoginTokenContext.Provider value={loginToken}>
				<SetSessionTokenContext.Provider value={setLocalStorageSessionToken}>
					<SessionTokenContext.Provider value={sessionTokenContextValue}>
						<ProjectSlugContext.Provider value={project}>
							<StageSlugContext.Provider value={stage}>
								<GraphQlClientFactoryContext.Provider value={graphqlClientFactory}>
									<PrimaryReadWindowsContext.Provider value={primaryReadWindows}>
										{children}
									</PrimaryReadWindowsContext.Provider>
								</GraphQlClientFactoryContext.Provider>
							</StageSlugContext.Provider>
						</ProjectSlugContext.Provider>
					</SessionTokenContext.Provider>
				</SetSessionTokenContext.Provider>
			</LoginTokenContext.Provider>
		</ApiBaseUrlContext.Provider>
	)
})

const useLocalStorageSessionToken = (): [value: string | undefined, set: (token: string | undefined) => void] => {
	const [sessionTokenInner, setSessionTokenInner] = useState(() => localStorage.getItem(sessionTokenKey) ?? undefined)

	const setSessionToken = useCallback((token: string | undefined) => {
		if (token !== undefined) {
			localStorage.setItem(sessionTokenKey, token)
		} else {
			localStorage.removeItem(sessionTokenKey)
		}
		setSessionTokenInner(token)
	}, [])

	return [sessionTokenInner, setSessionToken]
}
