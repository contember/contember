import { useCallback, useMemo, useState } from 'react'
import { Identity, IdentityMethods, IdentityStateValue } from '../types'
import { GraphQlClientError, useSessionToken } from '@contember/react-client'
import { useLogoutInternal } from '../internal/hooks/useLogoutInternal'
import { useMeQuery } from './queries'

export const useFetchIdentity = (): [{ state: IdentityStateValue; identity: Identity | undefined }, IdentityMethods] => {
	const sessionToken = useSessionToken()
	const fetchMe = useMeQuery()

	const [identityState, setIdentityState] = useState<ReturnType<typeof useFetchIdentity>[0]>({ state: sessionToken ? 'loading' : 'none', identity: undefined })

	const clearIdentity = useCallback(() => setIdentityState({ state: 'cleared', identity: undefined }), [])
	const logout = useLogoutInternal(clearIdentity)

	const fetch = useCallback(async () => {
		setIdentityState({ state: 'loading', identity: undefined })
		try {
			const response = await fetchMe({})
			const person = response.person
			const projects = response.projects
			const permissions = response.permissions ?? { canCreateProject: false }

			setIdentityState({
				state: 'success',
				identity: {
					id: response.id,
					person: person ?? undefined,
					projects: projects.map(it => ({
						name: it.project.name,
						slug: it.project.slug,
						roles: it.memberships.map(it => it.role),
					})),
					permissions,
				},
			})
		} catch (e) {
			console.error(e)
			if (e instanceof GraphQlClientError && e.response?.status === 401) {
				logout({ noRedirect: true })
			} else {
				setIdentityState({ state: 'failed', identity: undefined })
			}
		}
	}, [fetchMe, logout])

	return [
		identityState,
		useMemo((): IdentityMethods => ({
			clearIdentity,
			refreshIdentity: fetch,
		}), [clearIdentity, fetch]),
	]
}
