import { BindingError, EnvironmentContext, useEnvironment } from '@contember/binding'
import { useProjectSlug } from '@contember/react-client'
import { ReactNode } from 'react'

export const projectEnvironmentExtension = (slug: string | null | undefined) => {
	if (slug === undefined) {
		throw new BindingError('Environment does not contain project slug state.')
	}
	return {
		slug: slug ?? undefined,
	}
}

export const ProjectEnvironmentExtensionProvider = ({ children }: {children?: ReactNode}) => {
	const env = useEnvironment()
	const slug = useProjectSlug()
	return (
		<EnvironmentContext.Provider value={env.withExtension(projectEnvironmentExtension, slug ?? null)}>
			{children}
		</EnvironmentContext.Provider>
	)
}
