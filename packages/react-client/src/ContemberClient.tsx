import { memo, useCallback, useMemo, useState } from 'react'
import { SessionTokenContext, SessionTokenContextValue, SetSessionTokenContext } from './auth'
import { ApiBaseUrlContext, LoginTokenContext } from './config'
import { ProjectSlugContext, StageSlugContext } from './project'

export interface ContemberClientProps {
	apiBaseUrl: string
	sessionToken?: string
	loginToken?: string
	project?: string
	stage?: string
}

const sessionTokenKey = 'contember_session_token'

export const ContemberClient = memo<ContemberClientProps & { children: React.ReactNode }>(function ContemberClient({
	apiBaseUrl,
	children,
	loginToken,
	project,
	sessionToken,
	stage,
}) {
	const [localStorageSessionToken, setLocalStorageSessionToken] = useLocalStorageSessionToken()

	const sessionTokenContextValue = useMemo((): SessionTokenContextValue => ({
		propsToken: sessionToken,
		token: localStorageSessionToken ?? sessionToken,
		source: localStorageSessionToken ? 'localstorage' : (sessionToken ? 'props' : undefined),
	}), [localStorageSessionToken, sessionToken])

	return (
		<ApiBaseUrlContext.Provider value={apiBaseUrl}>
			<LoginTokenContext.Provider value={loginToken}>
				<SetSessionTokenContext.Provider value={setLocalStorageSessionToken}>
					<SessionTokenContext.Provider value={sessionTokenContextValue}>
						<ProjectSlugContext.Provider value={project}>
							<StageSlugContext.Provider value={stage}>{children}</StageSlugContext.Provider>
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
