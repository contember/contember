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
import { LogOutIcon, UserIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { panelRegistry } from '../modules/index.js'
import { indexPageName } from '../modules/registry.js'
import { PanelNavigation } from './PanelNavigation.js'
import { ProjectSwitcher } from './ProjectSwitcher.js'
import { useProjectParameter } from './requestParameters.js'
import { useSignOut } from './signOut.js'
import { PanelSlotTargets } from './slots.js'

const SignedInAs = () => {
	const identity = useIdentity()
	const signOut = useSignOut()

	return (
		<>
			<div className="flex items-center gap-2 overflow-hidden px-2 text-sm">
				<UserIcon className="size-4 shrink-0 text-muted-foreground" />
				<span className="truncate">{identity?.person?.email ?? identity?.person?.name ?? 'Signed in'}</span>
			</div>
			<Button variant="outline" size="sm" className="w-full gap-2" onClick={signOut}>
				<LogOutIcon className="size-4" />
				Sign out
			</Button>
		</>
	)
}

export const PanelLayout = ({ children }: { children: ReactNode }) => {
	const identity = useIdentity()
	const projectSlug = useProjectParameter()
	const modules = identity === undefined ? [] : panelRegistry.availableModules({ identity, projectSlug })
	const globalModules = modules.filter(it => it.scope === 'global')
	const projectModules = modules.filter(it => it.scope === 'project')
	const projectName = identity?.projects.find(it => it.slug === projectSlug)?.name

	return (
		<SidebarProvider>
			<SidebarLayout>
				<Sidebar collapsible="offcanvas" side="left">
					<SidebarHeader>
						<Link to={indexPageName}>
							<a className="px-2 py-1 font-semibold">Contember management</a>
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
								<SidebarGroupLabel>{projectName ?? 'Project'}</SidebarGroupLabel>
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
							<PanelSlotTargets.Title />
						</SidebarInsetHeaderActions>
						<SidebarInsetHeaderActions>
							<PanelSlotTargets.Actions />
						</SidebarInsetHeaderActions>
					</SidebarInsetHeader>
					<SidebarInsetContent>{children}</SidebarInsetContent>
				</SidebarInset>
			</SidebarLayout>
		</SidebarProvider>
	)
}
