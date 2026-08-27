import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { WriteRefTracker } from '@contember/graphql-client'
import {
	ApiBaseUrlContext,
	GraphQlClientFactoryContext,
	LoginTokenContext,
	ProjectSlugContext,
	ReadAfterWriteTrackersContext,
	SessionTokenContext,
	SetSessionTokenContext,
	StageSlugContext,
} from '../contexts.js'
import { GraphQlClientFactory, SessionTokenContextValue } from '../types/index.js'

export interface ContemberClientProps {
	apiBaseUrl: string
	sessionToken?: string
	loginToken?: string
	project?: string
	stage?: string
	graphqlClientFactory?: GraphQlClientFactory
	/** Ask the API to serve a query only from a replica that has already seen this identity's writes. */
	readAfterWrite?: boolean
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
	readAfterWrite = true,
}) {
	const [localStorageSessionToken, setLocalStorageSessionToken] = useLocalStorageSessionToken()

	const sessionTokenContextValue = useMemo((): SessionTokenContextValue => ({
		propsToken: sessionToken,
		token: localStorageSessionToken ?? sessionToken,
		source: localStorageSessionToken ? 'localstorage' : (sessionToken ? 'props' : undefined),
	}), [localStorageSessionToken, sessionToken])

	// Write references belong to the identity that made them, so a different token starts from an empty map.
	const trackersRef = useRef<{ token: string | undefined; trackers: Map<string, WriteRefTracker> } | null>(null)
	if (trackersRef.current === null || trackersRef.current.token !== sessionTokenContextValue.token) {
		trackersRef.current = { token: sessionTokenContextValue.token, trackers: new Map() }
	}
	const readAfterWriteTrackers = readAfterWrite ? trackersRef.current.trackers : undefined

	return (
		<ApiBaseUrlContext.Provider value={apiBaseUrl}>
			<LoginTokenContext.Provider value={loginToken}>
				<SetSessionTokenContext.Provider value={setLocalStorageSessionToken}>
					<SessionTokenContext.Provider value={sessionTokenContextValue}>
						<ProjectSlugContext.Provider value={project}>
							<StageSlugContext.Provider value={stage}>
								<GraphQlClientFactoryContext.Provider value={graphqlClientFactory}>
									<ReadAfterWriteTrackersContext.Provider value={readAfterWriteTrackers}>
										{children}
									</ReadAfterWriteTrackersContext.Provider>
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
