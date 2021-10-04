import { Layout, Logotype, Menu, Pages } from '@contember/admin'
import { FC } from 'react'
import * as pages from './pages'

const SandboxLayout: FC = props => {
	return (
		<Layout
			children={props.children}
			navBarHead={<Logotype>Contember</Logotype>}
			navigation={<Menu>
				<Menu.Item title="Dashboard" to={'dashboard'}>
					<Menu.Item title="Inputs" to="inputs" />
					<Menu.Item title="Tags" to="tags" />
					<Menu.Item title="Categories" to="categories" />
					<Menu.Item title="Articles" to="articleList" />
					<Menu.Item title="Homepage" to="homepage" />
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
