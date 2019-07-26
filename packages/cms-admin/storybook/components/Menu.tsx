import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { Icon } from '@blueprintjs/core'
import { Menu, MenuList, MenuPageLinkPrimary, MenuPageLink } from '../../src/components/ui'
import { DummyAdmin } from '../DummyAdmin'

export const menu = (
	<Menu>
		<MenuList title="Menu">
			<MenuPageLinkPrimary change={() => ({ name: 'dashboard', params: {} })} name="Dashboard" />
			<MenuPageLinkPrimary
				change={() => ({ name: 'dashboard', params: {} })}
				name="Dashboard"
				note="The starting point"
			/>
		</MenuList>
		<MenuList title="Pages">
			<MenuPageLink change={() => ({ name: 'edit_page', params: { id: '79eb5a3e-91b0-4499-8aa4-c490e5313960' } })}>
				Page
			</MenuPageLink>
			<MenuPageLink change={() => ({ name: 'edit_post2', params: { id: '14474645-d439-446c-bac3-e104a9b72a86' } })}>
				Post2
			</MenuPageLink>
			<MenuPageLink change={() => ({ name: 'postList', params: {} })}>All Posts</MenuPageLink>
		</MenuList>
	</Menu>
)

storiesOf('Menu', module).add('simple', () => <DummyAdmin>{menu}</DummyAdmin>)
