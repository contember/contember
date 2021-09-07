import { ApiBaseUrlContext, ContemberClient, LoginTokenContext } from '@contember/react-client'
import { FC, useState } from 'react'
import { Login } from './Login'
import { Project } from '../Project'
import { LoginProjects } from './LoginProjects'
import { ToasterProvider } from '../Toaster'

export interface LoginEntrypointProps {
	apiBaseUrl: string
	loginToken: string
	sessionToken?: string
	projects: null | Project[]
	formatProjectUrl: (project: Project) => string
}


export const LoginEntrypoint = (props: LoginEntrypointProps) => {
	return (
		<ContemberClient
			apiBaseUrl={props.apiBaseUrl}
			sessionToken={props.sessionToken}
			loginToken={props.loginToken}
		>
			<ToasterProvider>
				<LoginEntrypointInner projects={props.projects} formatProjectUrl={props.formatProjectUrl} />
			</ToasterProvider>
		</ContemberClient>
	)
}

const LoginEntrypointInner: FC<Pick<LoginEntrypointProps, 'projects' | 'formatProjectUrl'>> = props => {
	const [projects, setProjects] = useState<null | Project[]>(props.projects)

	if (projects === null) {
		return <Login onLogin={setProjects} />

	} else if (projects.length === 1) {
		window.location.href = props.formatProjectUrl(projects[0])
		return null

	} else {
		return <LoginProjects projects={projects} formatProjectUrl={props.formatProjectUrl} />
	}
}
