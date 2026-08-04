import { useProjectSlug, useStageSlug } from '@contember/react-client'
import { useIdentity } from '@contember/react-client-tenant'
import { useProjectUserRoles } from '@contember/react-identity'
import { Link, useCurrentRequest } from '@contember/react-routing'
import { Card } from '@contember/react-ui-lib-base'
import { ArrowRightIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { PageHeader, PageStack } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'
import { panelRegistry } from '../index.js'

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
	<Card className="flex flex-col gap-1 p-5">
		<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
		<span className="truncate font-mono text-sm">{children}</span>
	</Card>
)

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
		<div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
			{modules.map(module => (
				<Link key={module.id} to={{ pageName: panelRegistry.entryPageOf(module), parameters: { project: projectSlug } }}>
					<a className="group block">
						<Card className="flex items-center gap-3 p-4 transition-colors group-hover:border-gray-300 group-hover:bg-accent/50">
							<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-background">
								{module.nav.icon}
							</span>
							<span className="truncate font-medium">{module.nav.label}</span>
							<ArrowRightIcon className="ml-auto size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
						</Card>
					</a>
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
	const identity = useIdentity()
	const roles = Array.from(useProjectUserRoles()).sort()
	const projectName = identity?.projects.find(it => it.slug === projectSlug)?.name

	return (
		<PageStack>
			<PanelSlots.Title>Overview</PanelSlots.Title>
			<PageHeader title={projectName ?? projectSlug ?? 'Project'} description="What this account may do in this project, and where to do it." />
			<div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-4">
				<Fact label="Project">{projectSlug ?? '—'}</Fact>
				<Fact label="Stage">{stageSlug ?? '—'}</Fact>
				<Fact label="Your roles">{roles.length === 0 ? '—' : roles.join(', ')}</Fact>
			</div>
			{projectSlug !== undefined && <ProjectModuleLinks projectSlug={projectSlug} />}
		</PageStack>
	)
}
