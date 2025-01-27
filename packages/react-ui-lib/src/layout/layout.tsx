import { Link } from '@contember/interface'
import { useHasActiveSlotsFactory } from '@contember/react-slots'
import { dataAttribute } from '@contember/utilities'
import { PropsWithChildren } from 'react'
import { Separator } from '../ui/separator'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInset,
	SidebarInsetContent,
	SidebarInsetHeader,
	SidebarInsetHeaderActions,
	SidebarLayout,
	SidebarMenuButton,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from '../ui/sidebar'
import { SlotTargets } from './slots'

export const LayoutComponent = ({ children }: PropsWithChildren) => {
	const isActive = useHasActiveSlotsFactory()
	const hasRightSidebar = isActive('Sidebar')

	return (
		<SidebarProvider>
			<SidebarLayout>
				<Sidebar collapsible="icon" side="left">
					<SidebarHeader>
						<Link to="index">
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								data-active={dataAttribute(false)}
							>
								<SlotTargets.Logo />
							</SidebarMenuButton>
						</Link>
					</SidebarHeader>
					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupContent>
								<SlotTargets.Navigation />
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>
					<SidebarFooter>
						<SlotTargets.UserNavigation />
					</SidebarFooter>
					<SidebarRail />
				</Sidebar>

				<SidebarInset className="max-h-screen overflow-hidden">
					<SidebarInsetHeader>
						<SidebarInsetHeaderActions>
							<SidebarTrigger className="-ml-1" />

							<Separator orientation="vertical" className="mr-2 h-4" />

							<SlotTargets.Back />
							<SlotTargets.Title />
						</SidebarInsetHeaderActions>
						<SidebarInsetHeaderActions>
							<SlotTargets.Actions />
						</SidebarInsetHeaderActions>
					</SidebarInsetHeader>

					<SidebarInsetContent>
						{children}
					</SidebarInsetContent>
				</SidebarInset>

				{hasRightSidebar && (
					<SidebarProvider>
						<Sidebar collapsible="icon" side="right" variant="inset">
							<SlotTargets.Sidebar />
							<SidebarRail />
						</Sidebar>
					</SidebarProvider>
				)}
			</SidebarLayout>
		</SidebarProvider>
	)
}
