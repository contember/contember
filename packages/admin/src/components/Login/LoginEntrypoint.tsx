import { ApiBaseUrlContext, LoginTokenContext } from '@contember/react-client'
import { useState } from 'react'
import { Login } from './Login'
import { Project, ProjectList } from '../Project'

export interface LoginEntrypointProps {
	apiBaseUrl: string
	loginToken: string
	projects: null | Project[]
	formatProjectUrl: (project: Project) => string
}

export const LoginEntrypoint = (props: LoginEntrypointProps) => {
	const [projects, setProjects] = useState<null | Project[]>(props.projects)

	if (projects === null) {
		return (
			<ApiBaseUrlContext.Provider value={props.apiBaseUrl}>
				<LoginTokenContext.Provider value={props.loginToken}>
					<Login onLogin={setProjects} />
				</LoginTokenContext.Provider>
			</ApiBaseUrlContext.Provider>
		)

	} else if (projects.length === 1) {
		window.location.href = props.formatProjectUrl(projects[0])
		return null

	} else {
		return <ProjectList projects={projects} formatProjectUrl={props.formatProjectUrl}/>
	}
}
