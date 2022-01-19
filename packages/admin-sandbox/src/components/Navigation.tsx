import { Menu } from '@contember/admin'

export const Navigation = () => (
	<Menu>
		<Menu.Item title="Dashboard" to="index">
			<Menu.Item title="Inputs" to="inputs" />
			<Menu.Item title="Tags" to="tags" />
			<Menu.Item title="Categories" to="categories" />
			<Menu.Item title="Articles" to="articleList" />
			<Menu.Item title="Homepage" to="homepage" />
			<Menu.Item title="Foo" to="foo" />
			<Menu.Item title="Bar" to="bar" />
			<Menu.Item title="Lorem" to="lorem">
				<Menu.Item title="Bar 2" to="bar">
					<Menu.Item title="Bar 3" to="bar" />
				</Menu.Item>
			</Menu.Item>
		</Menu.Item>
		<Menu.Item title="Other">
			<Menu.Item title="Bar 4" to="bar" />
		</Menu.Item>
	</Menu>
)
