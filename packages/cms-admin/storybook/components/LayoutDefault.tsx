import * as React from 'react'
import { storiesOf } from '@storybook/react'
// import { Icon } from '@blueprintjs/core'
// import { Menu, MenuList, MenuPageLinkPrimary, MenuPageLink } from '../../src/components/ui'
import LayoutDefault from '../../src/components/LayoutDefault'
import { DummyAdmin } from '../DummyAdmin'
import { menu } from './Menu'

storiesOf('Layout', module).add('simple', () => (
	<DummyAdmin>
		{/* {menu} */}
		<LayoutDefault
			header={{ left: 'Blog', right: '' }}
			side={menu}
			content={<div style={{ background: 'red', width: '100%', height: '100vh' }} />}
		/>
	</DummyAdmin>
))
