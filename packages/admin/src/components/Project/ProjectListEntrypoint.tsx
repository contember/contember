import { ClientConfig } from '../../bootstrap'
import { ProjectList } from './ProjectList'
import { ProjectEntrypoint } from './ProjectEntrypoint'
import { ProjectConfig } from './ProjectConfig'

export interface ProjectListEntrypointProps {
	clientConfig: ClientConfig
	projectConfigs: ProjectConfig[]
}

export const ProjectListEntrypoint = (props: ProjectListEntrypointProps) => {
	const projectSlug = window.location.pathname.split('/')[1]
	const projectConfig = props.projectConfigs.find(it => it.project === projectSlug)

	if (projectConfig) {
		return (
			<ProjectEntrypoint
				key={projectConfig.project}
				basePath={`/${projectConfig.project}/`}
				clientConfig={props.clientConfig}
				projectConfig={projectConfig}
			/>
		)

	} else {
		const projects = props.projectConfigs.map(it => ({ slug: it.project, name: it.project }))
		return <ProjectList projects={projects} formatProjectUrl={it => `/${it.slug}/`} />
	}
}
