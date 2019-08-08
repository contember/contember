import * as React from 'react'
import { storiesOf } from '@storybook/react'
import LayoutDefault from '../../src/components/LayoutDefault'
import { DummyAdmin } from '../DummyAdmin'
import { menu } from './Menu'

storiesOf('Layout', module).add('simple', () => (
	<DummyAdmin>
		<LayoutDefault
			header={{
				left: (
					<a className="navbar-title" href="#">
						Blog
					</a>
				),
				right: '',
			}}
			side={menu}
			content={<div style={{ background: 'red', width: '100%', height: '100vh' }} />}
		/>
	</DummyAdmin>
))
