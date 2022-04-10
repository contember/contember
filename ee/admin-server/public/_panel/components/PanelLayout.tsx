import { AnchorButton, ContemberLogoImage, Layout, Logo, Menu, RoutingLink } from '@contember/admin'
import { ReactNode } from 'react'

export interface PanelLayoutProps {
	children?: ReactNode
}

export const PanelLayout = (props: PanelLayoutProps) => (
	<Layout
		children={props.children}
		sidebarHeader={
			<RoutingLink to="projectList">
				<Logo image={<ContemberLogoImage withLabel />} />
			</RoutingLink>
		}
		sidebarFooter={
			<AnchorButton distinction="seamless" href="/" justification="justifyStart">
				&larr; Close Admin Panel
			</AnchorButton>
		}
		navigation={
			<Menu>
				<Menu.Item title={'Contember Admin Panel'}>
					<Menu.Item title="Projects" to={'projectList'} />
					<Menu.Item title="Profile security" to={'security'} />
				</Menu.Item>
			</Menu>
		}
	/>
)
