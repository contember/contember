import * as React from 'react'
import { Menu } from '@contember/admin'

export const SideMenu = () => (
	<Menu>
		<Menu.Item>
			<Menu.Item title="Dashboard" to="dashboard" />
		</Menu.Item>
	</Menu>
)
