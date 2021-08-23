import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useSessionToken } from '@contember/react-client'
import { useTenantMe } from '../../tenant/hooks/me'
import { ContainerSpinner, Message } from '@contember/ui'

export interface Identity {
	email: string
	personId: string
	projects: IdentityProject[] // TODO: drop other projects
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
export const IdentityProvider: React.FC = ({ children }) => {
	const [identity, setIdentity] = useState<Identity>()
	const [identityCleared, setIdentityCleared] = useState(false)
	const sessionToken = useSessionToken()
	const { state: me } = useTenantMe()

	useEffect(
		() => {
			if (!me.finished || me.error || sessionToken === undefined || identity) {
				return
			}

			const person = me.data.me.person
			const projects = me.data.me.projects

			setIdentity({
				email: person.email,
				personId: person.id,
				projects: projects.map(it => ({
					name: it.project.name,
					slug: it.project.slug,
					roles: it.memberships.map(it => it.role),
				})),
			})
		},
		[identity, sessionToken, me],
	)
	const clearIdentity = useCallback(() => {
		setIdentity(undefined)
		setIdentityCleared(true)
	}, [])

	const identityContextValue = useMemo(() => identity ? {
		clearIdentity,
		identity,
	} : undefined, [identity, clearIdentity])

	if (identityCleared) {
		return <Message type="default">Logging out...</Message>
	}
	if (me.error) {
		return <Message type="danger">Failed to fetch an identity</Message>
	}

	if (!identity) {
		return <ContainerSpinner/>
	}

	return <IdentityContext.Provider value={identityContextValue}>{children}</IdentityContext.Provider>
}
