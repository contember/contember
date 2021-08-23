import { lazy, Suspense } from 'react'
import { ContainerSpinner } from '@contember/ui'
import { ProjectConfig } from '../../state/projectsConfigs'
import { ClientConfig } from '../../bootstrap'

export interface ProjectEntrypointInnerProps {
	clientConfig: ClientConfig
	projectConfig: ProjectConfig
}

export const ProjectEntrypointInner = (props: ProjectEntrypointInnerProps) => {
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
