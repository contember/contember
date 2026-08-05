import { useIdentity } from '@contember/react-client-tenant'
import { Link } from '@contember/react-routing'
import {
	Button,
	Separator,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarInsetContent,
	SidebarInsetHeader,
	SidebarInsetHeaderActions,
	SidebarLayout,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from '@contember/react-ui-lib-base'
import { BoxIcon, LogOutIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { indexPageName } from '../modules/registry.js'
import { useAvailableModules } from './modules.js'
import { PanelNavigation } from './PanelNavigation.js'
import { ProjectSwitcher } from './ProjectSwitcher.js'
import { useProjectParameter } from './requestParameters.js'
import { useSignOut } from './signOut.js'
import { PanelSlotTargets } from './slots.js'

const SignedInAs = () => {
	const identity = useIdentity()
	const signOut = useSignOut()
	const email = identity?.person?.email
	const name = identity?.person?.name ?? email ?? 'Signed in'

	return (
		<div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
			<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground">
				{name.slice(0, 1)}
			</span>
			<div className="flex min-w-0 flex-col leading-tight">
				<span className="truncate text-sm font-medium">{name}</span>
				{email !== undefined && email !== name && <span className="truncate text-xs text-muted-foreground">{email}</span>}
			</div>
			<Button variant="ghost" size="icon" className="ml-auto size-8 shrink-0 text-muted-foreground" onClick={signOut} title="Sign out">
				<LogOutIcon className="size-4" />
				<span className="sr-only">Sign out</span>
			</Button>
		</div>
	)
}

export const PanelLayout = ({ children }: { children: ReactNode }) => {
	const identity = useIdentity()
	const projectSlug = useProjectParameter()
	const modules = useAvailableModules(projectSlug)
	const globalModules = modules.filter(it => it.scope === 'global')
	const projectModules = modules.filter(it => it.scope === 'project')
	const projectName = identity?.projects.find(it => it.slug === projectSlug)?.name

	return (
		<SidebarProvider>
			<SidebarLayout>
				<Sidebar collapsible="offcanvas" side="left">
					<SidebarHeader>
						<Link to={indexPageName}>
							<a className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-sidebar-accent">
								<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
									<BoxIcon className="size-4" />
								</span>
								<span className="flex flex-col leading-tight">
									<span className="text-sm font-semibold">Contember</span>
									<span className="text-xs text-muted-foreground">Management</span>
								</span>
							</a>
						</Link>
					</SidebarHeader>
					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupContent>
								<PanelNavigation modules={globalModules} />
							</SidebarGroupContent>
						</SidebarGroup>
						{projectModules.length > 0 && (
							<SidebarGroup>
								<SidebarGroupLabel>Project</SidebarGroupLabel>
								<SidebarGroupContent className="flex flex-col gap-2">
									<ProjectSwitcher projectSlug={projectSlug} />
									{projectSlug !== undefined && <PanelNavigation modules={projectModules} projectSlug={projectSlug} />}
								</SidebarGroupContent>
							</SidebarGroup>
						)}
					</SidebarContent>
					<SidebarFooter>
						<SignedInAs />
					</SidebarFooter>
					<SidebarRail />
				</Sidebar>

				<SidebarInset className="max-h-screen overflow-hidden">
					<SidebarInsetHeader>
						<SidebarInsetHeaderActions>
							<SidebarTrigger className="-ml-1" />
							<Separator orientation="vertical" className="mr-2 h-4" />
							{/* Breadcrumb rather than a heading: the page itself carries the h1. */}
							<nav className="flex items-center gap-2 text-sm">
								{projectName !== undefined && (
									<>
										<span className="text-muted-foreground">{projectName}</span>
										<span className="text-muted-foreground/50">/</span>
									</>
								)}
								<PanelSlotTargets.Title className="font-medium" />
							</nav>
						</SidebarInsetHeaderActions>
						<SidebarInsetHeaderActions>
							<PanelSlotTargets.Actions />
						</SidebarInsetHeaderActions>
					</SidebarInsetHeader>
					<SidebarInsetContent className="bg-muted/40 p-0">
						<div className="mx-auto w-full max-w-5xl px-6 py-8">{children}</div>
					</SidebarInsetContent>
				</SidebarInset>
			</SidebarLayout>
		</SidebarProvider>
	)
}
