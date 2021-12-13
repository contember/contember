import { ContemberClient } from '@contember/react-client'
import { FC, useState } from 'react'
import { Login } from './Login'
import { Project, ProjectListButtons } from '../Project'
import { Toaster, ToasterProvider } from '../Toaster'
import { RequestProvider, RoutingContext, RoutingContextValue } from '../../routing'
import { Page, PageLink, Pages } from '../pageRouting'
import { CreateResetPasswordRequestForm, FillResetPasswordTokenForm, ResetPasswordForm } from '../../tenant'
import { MiscPageLayout } from '../MiscPageLayout'
import { useLogout } from '../Identity'
import { AnchorButton, Button, Icon } from '@contember/ui'

export interface LoginEntrypointProps {
	apiBaseUrl: string
	loginToken: string
	sessionToken?: string
	basePath?: string
	projects: null | readonly Project[]
	formatProjectUrl: (project: Project) => string
}


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
							<Page name={'index'}>
								<LoginEntrypointInner projects={props.projects} formatProjectUrl={props.formatProjectUrl} />
							</Page>
							<Page name={'resetRequest'}>
								<MiscPageLayout heading="Password reset" actions={<>
									<PageLink to={'index'}>Back to login</PageLink>
								</>}>
									<CreateResetPasswordRequestForm redirectOnSuccess={'resetRequestSuccess'} />
								</MiscPageLayout>
							</Page>
							<Page name={'resetRequestSuccess'}>
								<MiscPageLayout heading="Password reset" actions={<>
									<PageLink to={'index'}>Back to login</PageLink>
								</>}>
									<p>
										Password reset request has been successfully created. Please check your inbox for the instructions.
									</p>
									<p>
										Please follow the link in e-mail or copy the reset token here:
									</p>
									<FillResetPasswordTokenForm
										resetLink={token => ({ pageName: 'passwordReset', parameters: { token } })} />
								</MiscPageLayout>
							</Page>
							<Page name={'passwordReset'}>
								{({ token }: { token: string }) => (
									<MiscPageLayout heading="Set a new password" actions={<>
										<PageLink to={'index'}>Back to login</PageLink>
									</>}>
										<ResetPasswordForm token={token} redirectOnSuccess={'index'} />
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

const LoginEntrypointInner: FC<Pick<LoginEntrypointProps, 'projects' | 'formatProjectUrl'>> = props => {
	const [projects, setProjects] = useState<null | readonly Project[]>(props.projects)
	const logout = useLogout()

	if (projects === null) {
		return (
			<MiscPageLayout heading="Contember Admin">
				<Login onLogin={setProjects} resetLink={'resetRequest'} />
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
