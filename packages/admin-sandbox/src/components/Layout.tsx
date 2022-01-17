import { ReactNode } from 'react'
import { ContemberLogoImage, Layout as ContemberLayout, Logo } from '@contember/admin'
import { Navigation } from './Navigation'

export const Layout = (props: { children?: ReactNode }) => (
	<ContemberLayout
		sidebarHeader={<Logo image={<ContemberLogoImage withLabel />}>Contember</Logo>}
		navigation={<Navigation />}
		children={props.children}
	/>
)
