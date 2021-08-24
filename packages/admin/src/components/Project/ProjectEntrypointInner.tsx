import { lazy, memo, Suspense } from 'react'
import { ContainerSpinner } from '@contember/ui'
import { ProjectConfig } from '../../state/projectsConfigs'

export interface ProjectEntrypointInnerProps {
	Component: ProjectConfig['component']
}

export const ProjectEntrypointInner = memo((props: ProjectEntrypointInnerProps) => {
	if (typeof props.Component === 'function') {
		const Component = lazy(props.Component)

		return (
			<Suspense fallback={<ContainerSpinner />}>
				<Component />
			</Suspense>
		)
	}

	return props.Component
})
