import { useCallback, useMemo, useState } from 'react'
import { Identity, IdentityMethods, IdentityStateValue } from '../types'
import { useSessionToken } from '@contember/react-client'
import { useFetchMe } from '../internal/hooks/useFetchMe'
import { useLogoutInternal } from '../internal/hooks/useLogoutInternal'

export const useFetchIdentity = (): [{ state: IdentityStateValue, identity: Identity | undefined }, IdentityMethods] => {
	const sessionToken = useSessionToken()
	const fetchMe = useFetchMe()

	const [identityState, setIdentityState] = useState<IdentityStateValue>(sessionToken ? 'loading' : 'none')
	const [identity, setIdentity] = useState<Identity | undefined>()

	const clearIdentity = useCallback(() => setIdentityState('cleared'), [])
	const logout = useLogoutInternal(clearIdentity)

	const fetch = useCallback(async () => {
		setIdentityState('loading')
		try {
			const response = await fetchMe()
			const person = response.person
			const projects = response.projects
			const permissions = response.permissions ?? { canCreateProject: false }

			setIdentityState('success')
			setIdentity({
				id: response.id,
				person: person ?? undefined,
				projects: projects.map(it => ({
					name: it.project.name,
					slug: it.project.slug,
					roles: it.memberships.map(it => it.role),
				})),
				permissions,
			})
		} catch (e) {
			console.error(e)
			if (typeof e === 'object' && e !== null && 'status' in e && (e as { status?: unknown }).status === 401) {
				logout({ noRedirect: true })
				setIdentityState('cleared')
			} else {
				setIdentityState('failed')
			}
		}
	}, [fetchMe, logout])

	return [
		{ state: identityState, identity },
		useMemo((): IdentityMethods => ({
			clearIdentity,
			refreshIdentity: fetch,
		}), [clearIdentity, fetch]),
	]
}
