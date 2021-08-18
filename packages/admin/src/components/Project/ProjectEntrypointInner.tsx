import { lazy, Suspense, useEffect } from 'react'
import { useSessionToken } from '@contember/react-client'
import { Environment, EnvironmentContext } from '@contember/binding'
import { ContainerSpinner } from '@contember/ui'
import { I18nProvider } from '../../i18n'
import type { ClientConfig, ProjectConfig } from 'index'
import type { AuthIdentity } from '../../state/auth'
import { useTenantMe } from '../../tenant/hooks/me'
import { createAction } from 'redux-actions'
import { SET_IDENTITY } from '../../reducer/auth'
import { useDispatch } from 'react-redux'
import { Router } from '../../containers/router'

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

	const rootEnv = Environment.create({ // TODO: move back to useState?
		...props.clientConfig.envVariables,
		dimensions: props.projectConfig.defaultDimensions ?? {},
	})

	const Component = typeof props.projectConfig.component === 'function'
		? lazy(props.projectConfig.component)
		: () => <>{props.projectConfig.component}</>

	return (
		<Router
			routes={{
				login: () => null, // TODO: drop
				projects_list: () => null, // TODO: drop
				project_page: ({ route }) => {
					const requestEnv = rootEnv
						.updateDimensionsIfNecessary(route.dimensions, props.projectConfig.defaultDimensions ?? {})
						.putDelta(route.parameters)

					return (
						<EnvironmentContext.Provider value={requestEnv}>
							<I18nProvider localeCode={props.projectConfig.defaultLocale} dictionaries={props.projectConfig.dictionaries}>
								<Suspense fallback={<ContainerSpinner />}>
									<Component />
								</Suspense>
							</I18nProvider>
						</EnvironmentContext.Provider>
					)
				},
			}}
		/>
	)
}
