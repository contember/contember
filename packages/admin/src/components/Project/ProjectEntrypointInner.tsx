import { lazy, Suspense, useEffect } from 'react'
import { useSessionToken } from '@contember/react-client'
import { ContainerSpinner } from '@contember/ui'
import type { AuthIdentity } from '../../state/auth'
import { useTenantMe } from '../../tenant/hooks/me'
import { createAction } from 'redux-actions'
import { SET_IDENTITY } from '../../reducer/auth'
import { useDispatch } from 'react-redux'
import { ProjectConfig } from '../../state/projectsConfigs'
import { ClientConfig } from '../../bootstrap'

export interface ProjectEntrypointInnerProps {
	clientConfig: ClientConfig
	projectConfig: ProjectConfig
}

export const ProjectEntrypointInner = (props: ProjectEntrypointInnerProps) => {
	const dispatch = useDispatch()
	const sessionToken = useSessionToken()
	const me = useTenantMe()

	useEffect(
		() => {
			if (!me.state.finished || me.state.error || sessionToken === undefined) {
				return
			}

			const person = me.state.data.me.person
			const projects = me.state.data.me.projects

			dispatch(
				createAction<AuthIdentity>(SET_IDENTITY, () => ({
					token: sessionToken,
					email: person.email,
					personId: person.id,
					projects: projects.map(it => ({
						name: it.project.name,
						slug: it.project.slug,
						roles: it.memberships.map(it => it.role),
					})),
				}))(),
			)
		},
		[dispatch, sessionToken, me],
	)

	if (!me.state.finished || me.state.error) {
		return null // TODO: handle error better (redirect to login?)
	}

	if (typeof props.projectConfig.component === 'function') {
		const Component = lazy(props.projectConfig.component)

		return (
			<Suspense fallback={<ContainerSpinner />}>
				<Component />
			</Suspense>
		)
	}

	return props.projectConfig.component
}
