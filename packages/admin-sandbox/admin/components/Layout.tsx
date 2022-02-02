import { ReactNode } from 'react'
import { ContemberLogoImage, Layout as ContemberLayout, Link, Logo } from '@contember/admin'
import { Navigation } from './Navigation'

export const Layout = (props: { children?: ReactNode }) => (
	<ContemberLayout
		sidebarHeader={<Link to="index"><Logo image={<ContemberLogoImage withLabel />} /></Link>}
		navigation={<Navigation />}
		children={props.children}
	/>
)
