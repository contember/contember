import { Menu } from '@contember/admin'

export const Navigation = () => (
	<Menu id="sandbox-menu">
		<Menu.Item title="Dashboard" to="index">
			<Menu.Item title="Inputs" to="inputs" />
			<Menu.Item title="Tags" to="tags" />
			<Menu.Item title="Categories" to="categories" />
			<Menu.Item title="Articles" to="article(action: 'list')" />
			<Menu.Item title="Homepage" to="homepage" />
			<Menu.Item title="Foo" to="foo" />
			<Menu.Item title="Foo Bar">
				<Menu.Item title="Skip this1" />
				<Menu.Item title="Foo Bar 1" to="fooBar1" />
				<Menu.Item title="Skip this1" />
			</Menu.Item>
			<Menu.Item title="Foo Bar 2" to="fooBar2">
				<Menu.Item title="Skip this1" />
				<Menu.Item title="Foo Bar Baz 1" to="fooBarBaz1" />
				<Menu.Item title="Skip this1" />
				<Menu.Item title="Foo Bar Baz 2" to="fooBarBaz2" />
				<Menu.Item title="Skip this1" />
			</Menu.Item>

			<Menu.Item title="Foo Bar 3" to="fooBar3">
				<Menu.Item title="Skip this" />
				<Menu.Item title="Skip this" />
					<Menu.Item title="Skip this1" />
					<Menu.Item title="Foo Bar Baz 4" to="fooBarBaz4">
					<Menu.Item title="Skip this1" />
					<Menu.Item title="Foo Bar 4" to="fooBar4">
						<Menu.Item title="Foo Bar Baz 5" to="fooBarBaz5" />
						<Menu.Item title="Skip this1" />
						<Menu.Item title="Foo Bar Baz 6" to="fooBarBaz6" />
						<Menu.Item title="Skip this1" />
					</Menu.Item>
				<Menu.Item title="Skip this1" />
				</Menu.Item>
			</Menu.Item>

			<Menu.Item title="Foo Bar 3" to="fooBar3">
				<Menu.Item title="Skip this1" />
				<Menu.Item title="Foo Bar Baz 3" to="fooBarBaz3" />
					<Menu.Item title="Skip this1" />
					<Menu.Item title="Foo Bar Baz 4" to="fooBarBaz4">
					<Menu.Item title="Skip this" />
					<Menu.Item title="Do not skip this!">
						<Menu.Item title="Foo Bar Baz 5" to="fooBarBaz5" />
						<Menu.Item title="Skip this1" />
						<Menu.Item title="Foo Bar Baz 6" to="fooBarBaz6" />
						<Menu.Item title="Skip this1" />
					</Menu.Item>
				<Menu.Item title="Skip this1" />
				</Menu.Item>
			</Menu.Item>
			<Menu.Item title="Skip this1" />
			<Menu.Item title="Bar" to="bar" />
			<Menu.Item title="Skip this1" />
			<Menu.Item title="Foo Bar" to="fooBar" />
			<Menu.Item title="Lorem" to="lorem">
				<Menu.Item title="Skip this1" />
				<Menu.Item title="Bar 2" to="bar">
					<Menu.Item title="Skip this1" />
					<Menu.Item title="Bar 3" to="bar" />
					<Menu.Item title="Skip this1" />
				</Menu.Item>
			</Menu.Item>
			<Menu.Item title="Skip this1" />
		</Menu.Item>
		<Menu.Item title="Other">
			<Menu.Item title="Skip this1" />
			<Menu.Item title="Bar 4" to="bar" />
			<Menu.Item title="Skip this1" />
		</Menu.Item>
	</Menu>
)
