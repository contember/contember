import { EnvironmentExtensionProvider } from '@contember/interface'
import { ProjectSlugContext, StageSlugContext } from '@contember/react-client'
import { projectEnvironmentExtension } from '@contember/react-identity'
import type { ReactNode } from 'react'

/** Stage most deployments ever have; stage-scoped routes will carry their own `:stage` segment. */
export const defaultStageSlug = 'live'

export interface ProjectScopeProviderProps {
	projectSlug: string
	stageSlug?: string
	children: ReactNode
}

/**
 * The entirety of "project scope": the content, system and actions clients build their URL from
 * these contexts, and `useEnvironmentWithSchema` loads the project's schema from them on demand.
 *
 * A component rather than layout code, so global routes are never wrapped in a half-initialised
 * project context.
 */
export const ProjectScopeProvider = ({ projectSlug, stageSlug = defaultStageSlug, children }: ProjectScopeProviderProps) => (
	// Keyed on the slug: remounting is what keeps a loaded schema from leaking across projects.
	<ProjectSlugContext.Provider key={projectSlug} value={projectSlug}>
		<StageSlugContext.Provider value={stageSlug}>
			<EnvironmentExtensionProvider extension={projectEnvironmentExtension} state={projectSlug}>
				{children}
			</EnvironmentExtensionProvider>
		</StageSlugContext.Provider>
	</ProjectSlugContext.Provider>
)
