import { useCallback, useMemo, useState } from 'react'
import { Identity, IdentityGlobalPermissions, IdentityMethods, IdentityStateValue } from '../types/index.js'
import { GraphQlClientError, useSessionToken } from '@contember/react-client'
import { useLogoutInternal } from '../internal/hooks/useLogoutInternal.js'
import { useMeQuery } from './queries/index.js'

const deniedGlobalPermissions: IdentityGlobalPermissions = {
	canCreateProject: false,
	canDeployEntrypoint: false,
	canViewConfiguration: false,
	canListIdentityProviders: false,
	canListMailTemplates: false,
	canManageConfiguration: false,
	canViewAuthLog: false,
	canListPersons: false,
	canListGlobalApiKeys: false,
	canCreateGlobalApiKey: false,
}

export const useFetchIdentity = (
	// Keep the signal stable across renders: a new one is a new `refreshIdentity`.
	{ signal }: { signal?: AbortSignal } = {},
): [{ state: IdentityStateValue; identity: Identity | undefined }, IdentityMethods] => {
	const sessionToken = useSessionToken()
	const fetchMe = useMeQuery()

	const [identityState, setIdentityState] = useState<ReturnType<typeof useFetchIdentity>[0]>({
		state: sessionToken ? 'loading' : 'none',
		identity: undefined,
	})

	const clearIdentity = useCallback(() => setIdentityState({ state: 'cleared', identity: undefined }), [])
	const logout = useLogoutInternal(clearIdentity)

	const fetch = useCallback(async () => {
		setIdentityState({ state: 'loading', identity: undefined })
		try {
			const response = await fetchMe({ signal })
			const person = response.person
			const projects = response.projects

			setIdentityState({
				state: 'success',
				identity: {
					id: response.id,
					roles: response.roles ?? [],
					person: person ?? undefined,
					projects: projects.map(it => ({
						name: it.project.name,
						slug: it.project.slug,
						roles: it.memberships.map(it => it.role),
						permissions: it.project.permissions,
					})),
					// `permissions` is nullable on an identity the caller may not inspect; that never
					// applies to `me`, but denying everything is the safe reading if it ever does.
					permissions: response.permissions ?? deniedGlobalPermissions,
				},
			})
		} catch (e) {
			// Cancelled on purpose, e.g. right before a redirect away from the page: not a failure.
			if (e instanceof GraphQlClientError && e.type === 'aborted') {
				return
			}
			console.error(e)
			if (e instanceof GraphQlClientError && e.response?.status === 401) {
				logout({ noRedirect: true })
			} else {
				setIdentityState({ state: 'failed', identity: undefined })
			}
		}
	}, [fetchMe, logout, signal])

	return [
		identityState,
		useMemo((): IdentityMethods => ({
			clearIdentity,
			refreshIdentity: fetch,
		}), [clearIdentity, fetch]),
	]
}
