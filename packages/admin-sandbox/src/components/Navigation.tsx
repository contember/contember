import { Menu } from '@contember/admin'

export const Navigation = () => (
	<Menu>
		<Menu.Item title="Dashboard" to="index">
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
	</Menu>
)
