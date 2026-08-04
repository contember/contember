import { useProjectSlug, useStageSlug } from '@contember/react-client'
import { useIdentity } from '@contember/react-client-tenant'
import { useProjectUserRoles } from '@contember/react-identity'
import { Link, useCurrentRequest } from '@contember/react-routing'
import { AnchorButton, PropertyItem, PropertyList } from '@contember/react-ui-lib-base'
import { PanelSlots } from '../../shell/slots.js'
import { panelRegistry } from '../index.js'

/** Composed from the registry, so a new project module appears here without an edit. */
const ProjectModuleLinks = ({ projectSlug }: { projectSlug: string }) => {
	const identity = useIdentity()
	const request = useCurrentRequest()
	if (identity === undefined || request === null) {
		return null
	}
	const currentModule = panelRegistry.pages.get(request.pageName)?.module
	const modules = panelRegistry
		.availableModules({ identity, projectSlug })
		.filter(it => it.scope === 'project' && it !== currentModule)

	return (
		<div className="flex flex-wrap gap-2">
			{modules.map(module => (
				<Link key={module.id} to={{ pageName: panelRegistry.entryPageOf(module), parameters: { project: projectSlug } }}>
					<AnchorButton variant="outline" className="gap-2">
						{module.nav.icon}
						{module.nav.label}
					</AnchorButton>
				</Link>
			))}
		</div>
	)
}

/**
 * Reads nothing but the project scope, which is the point: it all comes from the contexts
 * `ProjectScopeProvider` supplies, so the content and system clients resolve here too.
 */
export const ProjectOverviewPage = () => {
	const projectSlug = useProjectSlug()
	const stageSlug = useStageSlug()
	const roles = Array.from(useProjectUserRoles()).sort()

	return (
		<>
			<PanelSlots.Title>Project overview</PanelSlots.Title>
			<div className="flex flex-col gap-4">
				<PropertyList>
					<PropertyItem label="Project">{projectSlug ?? '—'}</PropertyItem>
					<PropertyItem label="Stage">{stageSlug ?? '—'}</PropertyItem>
					<PropertyItem label="Your roles">{roles.length === 0 ? '—' : roles.join(', ')}</PropertyItem>
				</PropertyList>
				{projectSlug !== undefined && <ProjectModuleLinks projectSlug={projectSlug} />}
			</div>
		</>
	)
}
