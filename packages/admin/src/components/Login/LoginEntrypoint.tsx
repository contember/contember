import { ContemberClient } from '@contember/react-client'
import { FC, ReactNode, useMemo, useState } from 'react'
import {
	CreateResetPasswordRequestForm,
	FillResetPasswordTokenForm,
	IDP,
	IDPInitButton,
	IDPResponseHandler,
	Login,
	ResetPasswordForm,
} from '../../tenant'
import { Project, ProjectListButtons } from '../Project'
import { Toaster, ToasterProvider } from '../Toaster'
import { RequestProvider, RoutingContext, RoutingContextValue } from '../../routing'
import { Page, PageLink, Pages } from '../pageRouting'
import { MiscPageLayout } from '../MiscPageLayout'
import { IdentityProvider, useLogout, useOptionalIdentity } from '../Identity'
import { Button, ErrorList, Icon } from '@contember/ui'


export interface LoginEntrypointProps {
	apiBaseUrl: string
	loginToken: string
	sessionToken?: string
	basePath?: string
	projects: readonly string[]
	identityProviders?: readonly IDP[]
	formatProjectUrl: (project: Project) => string
	heading?: string
	projectsPageActions?: ReactNode
}

const indexPageName = 'index'
const resetRequestPageName = 'resetRequest'
const redirectOnSuccessPageName = 'resetRequestSuccess'
const passwordResetPageName = 'passwordReset'

export const LoginEntrypoint = (props: LoginEntrypointProps) => {
	const routing: RoutingContextValue = {
		basePath: props.basePath ?? '/',
		routes: {},
		defaultDimensions: {},
		pageInQuery: true,
	}

	return (
		<ContemberClient
			apiBaseUrl={props.apiBaseUrl}
			sessionToken={props.sessionToken}
			loginToken={props.loginToken}
		>
			<ToasterProvider>
				<RoutingContext.Provider value={routing}>
					<RequestProvider>
						<Pages>
							<Page name={indexPageName}>
								<IdentityProvider allowUnauthenticated={true}>
									<LoginEntrypointIndex
										projects={props.projects}
										formatProjectUrl={props.formatProjectUrl}
										identityProviders={props.identityProviders}
										heading={props.heading}
										projectsPageActions={props.projectsPageActions}
									/>
								</IdentityProvider>
							</Page>
							<Page name={resetRequestPageName}>
								<MiscPageLayout heading="Password reset" actions={<>
									<PageLink to={indexPageName}>Back to login</PageLink>
								</>}>
									<CreateResetPasswordRequestForm redirectOnSuccess={redirectOnSuccessPageName} />
								</MiscPageLayout>
							</Page>
							<Page name={redirectOnSuccessPageName}>
								<MiscPageLayout heading="Password reset" actions={<>
									<PageLink to={indexPageName}>Back to login</PageLink>
								</>}>
									<p>
										Password reset request has been successfully created. Please check your inbox for the instructions.
									</p>
									<p>
										Please follow the link in e-mail or copy the reset token here:
									</p>
									<FillResetPasswordTokenForm resetLink={token => ({ pageName: passwordResetPageName, parameters: { token } })} />
								</MiscPageLayout>
							</Page>
							<Page name={passwordResetPageName}>
								{({ token }: { token: string }) => (
									<MiscPageLayout heading="Set a new password" actions={<>
										<PageLink to={indexPageName}>Back to login</PageLink>
									</>}>
										<ResetPasswordForm token={token} redirectOnSuccess={indexPageName} />
									</MiscPageLayout>
								)}
							</Page>
						</Pages>
					</RequestProvider>
				</RoutingContext.Provider>
				<Toaster />
			</ToasterProvider>
		</ContemberClient>
	)
}

const LoginEntrypointIndex: FC<Pick<LoginEntrypointProps, 'projects' | 'formatProjectUrl' | 'identityProviders' | 'heading' | 'projectsPageActions'>> = props => {
	const logout = useLogout()
	const identity = useOptionalIdentity()
	const projects = useMemo(() => {
		return identity?.projects.filter(it => props.projects.includes(it.slug))
	}, [identity?.projects, props.projects])

	if (!projects) {
		return (
			<MiscPageLayout heading={props.heading ?? 'Contember Admin'}>
				<LoginContainer identityProviders={props.identityProviders} />
			</MiscPageLayout>
		)

	} else if (projects.length === 1) {
		window.location.href = props.formatProjectUrl(projects[0])
		return null

	} else {
		return (
			<MiscPageLayout
				heading="Projects"
				actions={<>
					{props.projectsPageActions}
					<Button onClick={() => logout()} size={'small'} distinction={'seamless'}><Icon blueprintIcon={'log-out'} /></Button>
				</>}
			>
				<ProjectListButtons projects={projects} formatProjectUrl={props.formatProjectUrl} />
			</MiscPageLayout>
		)
	}
}

const LoginContainer = ({ identityProviders }: {
	identityProviders?: readonly IDP[],
}) => {
	const [error, setError] = useState<string>()

	const hasOauthResponse = useMemo(() => {
		const params = new URLSearchParams(window.location.search)
		return params.has('state') && params.has('code') && params.has('scope')
	}, [])

	if (hasOauthResponse) {
		return <IDPResponseHandler />
	}

	return <>
		<ErrorList errors={error ? [{ message: error }] : []} />
		<Login resetLink={resetRequestPageName} />
		{identityProviders?.map(it => <IDPInitButton provider={it} onError={setError}/>)}
	</>
}
