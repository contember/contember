import { Layout as ContemberLayout } from '@contember/admin'
import * as React from 'react'
import { ReactNode } from 'react'
import { Navigation } from './Navigation'

export const Layout = (props: { children?: ReactNode }) => (
	<ContemberLayout
		sidebarHeader="{projectName}"
		navigation={<Navigation />}
	>
		{props.children}
	</ContemberLayout>
)
