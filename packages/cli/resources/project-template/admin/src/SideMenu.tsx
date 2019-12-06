import * as React from 'react'
import { Menu } from '@contember/admin'

export const SideMenu = React.memo(props => {
	return (
		<Menu>
			<Menu.Item>
				<Menu.Item title="Posts" to="postList" />
			</Menu.Item>
		</Menu>
	)
})
