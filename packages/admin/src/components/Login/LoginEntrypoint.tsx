import { ContemberClient } from '@contember/react-client'
import { FC, useMemo, useState } from 'react'
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
import { useLogout } from '../Identity'
import { AnchorButton, Button, ErrorList, Icon } from '@contember/ui'


export interface LoginEntrypointProps {
	apiBaseUrl: string
	loginToken: string
	sessionToken?: string
	basePath?: string
	projects: null | readonly Project[]
	identityProviders?: readonly IDP[]
	formatProjectUrl: (project: Project) => string
	heading?: string
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
								<LoginEntrypointIndex
									projects={props.projects}
									formatProjectUrl={props.formatProjectUrl}
									identityProviders={props.identityProviders}
									heading={props.heading}
								/>
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

const LoginEntrypointIndex: FC<Pick<LoginEntrypointProps, 'projects' | 'formatProjectUrl' | 'identityProviders' | 'heading'>> = props => {
	const [projects, setProjects] = useState<null | readonly Project[]>(props.projects)
	const logout = useLogout()

	if (projects === null) {
		return (
			<MiscPageLayout heading={props.heading ?? 'Contember Admin'}>
				<LoginContainer identityProviders={props.identityProviders} setProjects={setProjects} />
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
					<AnchorButton href={'/_panel/'} size={'small'} distinction={'seamless'}><Icon
						blueprintIcon={'cog'} /></AnchorButton>
					<Button onClick={logout} size={'small'} distinction={'seamless'}><Icon blueprintIcon={'log-out'} /></Button>
				</>}
			>
				<ProjectListButtons projects={projects} formatProjectUrl={props.formatProjectUrl} />
			</MiscPageLayout>
		)
	}
}

const LoginContainer = ({ identityProviders, setProjects }: {
	identityProviders?: readonly IDP[],
	setProjects: (projects: Project[]) => void,
}) => {
	const [error, setError] = useState<string>()


	const hasOauthResponse = useMemo(() => {
		const params = new URLSearchParams(window.location.search)
		return params.has('state') && params.has('code') && params.has('scope')
	}, [])

	if (hasOauthResponse) {
		return <IDPResponseHandler onLogin={setProjects} />
	}

	return <>
		<ErrorList errors={error ? [{ message: error }] : []} />
		<Login onLogin={setProjects} resetLink={resetRequestPageName} />
		{identityProviders?.map(it => <IDPInitButton provider={it} onError={setError}/>)}
	</>
}
