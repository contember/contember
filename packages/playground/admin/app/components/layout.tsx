import { Link } from '@contember/interface'
import { memo, PropsWithChildren } from 'react'
import { IdentityLoader } from '~/lib/binding'
import { Slots } from '~/lib/layout'
import { LayoutComponent } from '~/lib/layout/layout'
import { SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader } from '~/lib/ui/sidebar'
import { Logo } from './logo'
import { Navigation, UserNavigation } from './navigation'

export const Layout = memo(({ children }: PropsWithChildren) => (
	<IdentityLoader>
		<LayoutComponent>
			<Slots.Logo>
				<Link to="index">
					<Logo />
				</Link>
			</Slots.Logo>

			<Slots.Navigation>
				<Navigation />
			</Slots.Navigation>

			<Slots.UserNavigation>
				<UserNavigation />
			</Slots.UserNavigation>

			<Slots.Footer>
				<p>
					<small>Created with <a className="content-link" href="https://www.contember.com/">AI-assisted Contember Studio</a></small>
				</p>
			</Slots.Footer>

			<Slots.Sidebar>
				<SidebarHeader>
					<h1>Header</h1>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							content
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				<SidebarFooter>
					footer
				</SidebarFooter>
			</Slots.Sidebar>

			{children}
		</LayoutComponent>
	</IdentityLoader>
))
Layout.displayName = 'Layout'
