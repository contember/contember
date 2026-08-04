import { useIdentity } from '@contember/react-client-tenant'
import { Link } from '@contember/react-routing'
import { Card } from '@contember/react-ui-lib-base'
import { ArrowRightIcon, FolderIcon, FoldersIcon } from 'lucide-react'
import { useProjectEntryTarget } from '../../shell/navigation.js'
import { EmptyState, PageHeader, PageStack } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'

/** Projects the identity belongs to — `me { projects }` already filters them. */
export const ProjectsPage = () => {
	const projects = useIdentity()?.projects ?? []
	const projectEntryTarget = useProjectEntryTarget()

	return (
		<PageStack>
			<PanelSlots.Title>Projects</PanelSlots.Title>
			<PageHeader title="Projects" description="Everything this account can reach. Open one to manage its members, API keys and secrets." />
			{projects.length === 0
				? (
					<EmptyState
						icon={<FoldersIcon className="size-5" />}
						title="No projects"
						description="This account is not a member of any project. A super admin sees every project; anyone else sees the ones they were added to."
					/>
				)
				: (
					<div className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-4">
						{projects.map(project => (
							<Link key={project.slug} to={projectEntryTarget(project.slug)}>
								<a className="group block">
									<Card className="flex h-full items-center gap-4 p-5 transition-colors group-hover:border-gray-300 group-hover:bg-accent/50">
										<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-background">
											<FolderIcon className="size-5" />
										</span>
										<span className="flex min-w-0 flex-col leading-tight">
											<span className="truncate font-medium">{project.name}</span>
											<span className="truncate font-mono text-xs text-muted-foreground">{project.slug}</span>
										</span>
										<ArrowRightIcon className="ml-auto size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
									</Card>
								</a>
							</Link>
						))}
					</div>
				)}
		</PageStack>
	)
}
