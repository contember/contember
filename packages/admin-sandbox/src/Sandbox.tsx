import { Layout, Menu, Pages } from '@contember/admin'
import * as pages from './pages'
import { FC } from 'react'

const SandboxLayout: FC = props => {
	return (
		<Layout
			children={props.children}
			sideBar={<Menu>
				<Menu.Item title="Dashboard" to={'dashboard'}>
					<Menu.Item title="Foo" to="fooPage" />
					<Menu.Item title="Bar" to="barPage" />
					<Menu.Item title="Lorem" to="loremPage">
						<Menu.Item title="Bar 2" to="barPage">
							<Menu.Item title="Bar 3" to="barPage" />
						</Menu.Item>
					</Menu.Item>
				</Menu.Item>
				<Menu.Item title="Other">
					<Menu.Item title="Bar 4" to="barPage" />
				</Menu.Item>
			</Menu>}
		/>
	)
}

export default () => <Pages layout={SandboxLayout} children={Object.values(pages)} />
