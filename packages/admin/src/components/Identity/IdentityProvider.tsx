import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useSessionToken } from '@contember/react-client'
import { useTenantMe } from '../../tenant/hooks/me'
import { AnchorButton, ContainerSpinner, Message } from '@contember/ui'
import { MiscPageLayout } from '../MiscPageLayout'

export interface Identity {
	email: string
	otpEnabled: boolean
	personId: string
	projects: IdentityProject[]
}

export interface IdentityProject {
	slug: string
	roles: string[]
}

interface IdentityContext {
	clearIdentity: () => void
	identity: Identity
}

export const IdentityContext = createContext<IdentityContext | undefined>(undefined)
export const IdentityRefreshContext = createContext<(() => void)>(() => {
	throw new Error('IdentityRefreshContext is not initialized')
})
export const IdentityProvider: React.FC<{onInvalidIdentity?: () => void }> = ({ children, onInvalidIdentity }) => {
	const [identity, setIdentity] = useState<Identity>()
	const [identityCleared, setIdentityCleared] = useState(false)
	const sessionToken = useSessionToken()
	const { state: me, refetch } = useTenantMe()

	useEffect(() => {
		if (me.error && onInvalidIdentity) {
			onInvalidIdentity()
		}
	}, [me.error, onInvalidIdentity])


	useEffect(
		() => {
			if (!me.finished || me.error || sessionToken === undefined) {
				return
			}

			const person = me.data.me.person
			const projects = me.data.me.projects

			setIdentity({
				email: person.email,
				otpEnabled: person.otpEnabled,
				personId: person.id,
				projects: projects.map(it => ({
					name: it.project.name,
					slug: it.project.slug,
					roles: it.memberships.map(it => it.role),
				})),
			})
		},
		[sessionToken, me],
	)

	const clearIdentity = useCallback(
		() => {
			setIdentity(undefined)
			setIdentityCleared(true)
		},
		[],
	)

	const identityContextValue = useMemo(
		() => identity ? { clearIdentity, identity } : undefined,
		[identity, clearIdentity],
	)

	if (identityCleared) {
		return (
			<MiscPageLayout>
				<Message type="default" size="large" flow="generousBlock">Logging out&hellip;</Message>
			</MiscPageLayout>
		)
	}

	if (me.error) {
		return (
			<MiscPageLayout>
				<Message type="danger" size="large" flow="generousBlock">Failed to fetch an identity</Message>
				<AnchorButton style={{ margin: '0 auto', display: 'block', textAlign: 'center', maxWidth: '100px' }} href={window.location.href}>Reload</AnchorButton>
			</MiscPageLayout>
		)
	}

	if (!identity) {
		return <ContainerSpinner />
	}

	return (
		<IdentityContext.Provider value={identityContextValue}>
			<IdentityRefreshContext.Provider value={refetch}>
				{children}
			</IdentityRefreshContext.Provider>
		</IdentityContext.Provider>
	)
}
