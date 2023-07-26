import { EnvironmentExtensionProvider } from '@contember/binding'
import { useSessionToken } from '@contember/react-client'
import { Message, SpinnerContainer } from '@contember/ui'
import { ReactNode, createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useFetchMe } from '../../tenant'
import { MiscPageLayout } from '../MiscPageLayout'
import { identityEnvironmentExtension } from './IdentityEnvironmentExtension'
import { InvalidIdentityFallback } from './InvalidIdentityFallback'
import { useLogout } from './useLogout'

export interface Identity {
	id: string
	person?: Person
	projects: IdentityProject[]
	permissions: {
		canCreateProject: boolean
	}

	/** @deprecated use person.email */
	email?: string
	/** @deprecated use person.otpEnabled */
	otpEnabled?: boolean
	/** @deprecated use person.id */
	personId?: string
}

export interface Person {
	id: string
	email: string
	otpEnabled: boolean
}

export interface IdentityProject {
	slug: string
	name: string
	roles: string[]
}

export interface IdentityContextValue {
	clearIdentity: () => void
	identity: Identity
}

export const IdentityContext = createContext<IdentityContextValue | undefined>(undefined)
export const IdentityRefreshContext = createContext<(() => void)>(() => {
	throw new Error('IdentityRefreshContext is not initialized')
})

export interface IdentityProviderProps {
	children: ReactNode
	onInvalidIdentity?: () => void
	allowUnauthenticated?: boolean
}

type IdentityState =
	| { state: 'none' }
	| { state: 'loading' }
	| { state: 'failed' }
	| { state: 'success', identity: Identity }
	| { state: 'cleared' }

export const IdentityProvider: React.FC<IdentityProviderProps> = ({ children, onInvalidIdentity, allowUnauthenticated }) => {
	const sessionToken = useSessionToken()
	const fetchMe = useFetchMe()

	const [identityState, setIdentityState] = useState<IdentityState>(() => ({ state: sessionToken ? 'loading' : 'none' }))

	const logout = useLogout()

	const clearIdentity = useCallback(() => setIdentityState({ state: 'cleared' }), [])

	const refetch = useCallback(async () => {
		setIdentityState({ state: 'loading' })
		try {
			const response = await fetchMe()
			const person = response.data.me.person
			const projects = response.data.me.projects
			const permissions = response.data.me.permissions

			setIdentityState({
				state: 'success',
				identity: {
					id: response.data.me.id,
					person: person ?? undefined,
					projects: projects.map(it => ({
						name: it.project.name,
						slug: it.project.slug,
						roles: it.memberships.map(it => it.role),
					})),
					permissions,

					email: person?.email ?? undefined,
					otpEnabled: person?.otpEnabled ?? undefined,
					personId: person?.id ?? undefined,
				},
			})
		} catch (e) {
			console.error(e)
			if (typeof e === 'object' && e !== null && 'status' in e && (e as { status?: unknown }).status === 401) {
				logout({ noRedirect: true })
				clearIdentity()
				if (onInvalidIdentity) {
					onInvalidIdentity()
				} else if (window.location.pathname !== '/') {
					window.location.href = '/' // todo better redirect?
				}
			} else {
				setIdentityState({ state: 'failed' })
			}
		}
	}, [clearIdentity, fetchMe, logout, onInvalidIdentity])


	useEffect(
		() => {
			if (sessionToken === undefined) {
				setIdentityState({ state: 'none' })
				if (!allowUnauthenticated) {
					if (onInvalidIdentity) {
						onInvalidIdentity()
					} else if (window.location.pathname !== '/') {
						window.location.href = '/' // todo better redirect?
					}
				}
				return
			}
		},
		[sessionToken, allowUnauthenticated, onInvalidIdentity],
	)

	useEffect(
		() => {
			if (sessionToken !== undefined) {
				refetch()
			}
		},
		[sessionToken, refetch],
	)


	const identityContextValue = useMemo(
		() => identityState.state === 'success' ? { clearIdentity, identity: identityState.identity } : undefined,
		[identityState, clearIdentity],
	)

	if (identityState.state === 'cleared') {
		return (
			<MiscPageLayout>
				<Message size="large" padding="large" display="block">Logging out&hellip;</Message>
			</MiscPageLayout>
		)
	}

	if (identityState.state === 'failed') {
		return <InvalidIdentityFallback />
	}

	const pending = identityState.state === 'loading' || (!allowUnauthenticated && identityState.state === 'none')

	return (
		<SpinnerContainer enabled={pending}>
			{pending ? null : (
				<EnvironmentExtensionProvider extension={identityEnvironmentExtension} state={identityContextValue?.identity ?? null}>
					<IdentityContext.Provider value={identityContextValue}>
						<IdentityRefreshContext.Provider value={refetch}>
							{children}
						</IdentityRefreshContext.Provider>
					</IdentityContext.Provider>
				</EnvironmentExtensionProvider>
			)}
		</SpinnerContainer>
	)
}
