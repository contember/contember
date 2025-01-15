import { Link } from '@contember/interface'
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
	SidebarLayout,
	SidebarMenuButton,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from '../ui/sidebar'
import { SlotTargets } from './slots'

export const LayoutComponent = ({ children }: PropsWithChildren) => (
	<SidebarProvider>
		<SidebarLayout>
			<Sidebar collapsible="icon">
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
			<SidebarInset>
				<header className="sticky top-0 bg-background z-50 flex justify-between h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b mb-4">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1" />

						<Separator orientation="vertical" className="mr-2 h-4" />

						<SlotTargets.Back />
						<SlotTargets.Title />
					</div>
					<div className="flex justify-end items-center gap-2 px-4">
						<SlotTargets.Actions />
					</div>
				</header>
				<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
					{children}
				</div>
			</SidebarInset>
		</SidebarLayout>
	</SidebarProvider>
)
