import * as React from 'react'
import { ReactNode } from 'react'
import { Layout as ContemberLayout } from '@contember/admin'
import { SideMenu } from './SideMenu'

export const Layout = (props: { children?: ReactNode }) => (
	<ContemberLayout
		topStart="{projectName}"
		sideBar={<SideMenu />}
		children={props.children}
	/>
)
