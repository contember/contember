import { Menu } from '@contember/admin'
import { ComponentIcon, FileTextIcon, LayoutDashboardIcon, ListTreeIcon, NewspaperIcon } from 'lucide-react'
import { Menu as HorizontalMenu } from './HorizontalMenu'

const articlesMenuItems = (
	<>
		<Menu.Item title="Tags" to="articles/tags" />
		<Menu.Item title="Categories" to="articles/categories" />
	</>
)

const componentsMenuItems = (
	<>
		<Menu.Item title="Actionable Boxes" to="actionableBoxes" />
		<Menu.Item title="Boxes" to="boxes" />
		<Menu.Item title="Buttons" to="buttons" />
		<Menu.Item title="FieldContainer" to="fieldContainers" />
		<Menu.Item title="Inputs" to="inputs" />
		<Menu.Item title="Messages" to="messages" />
		<Menu.Item title="Slots" to="slots">
			<Menu.Item title="Title Fallback" to="slots/fallback" />
		</Menu.Item>
		<Menu.Item title="Text areas" to="textareas" />
	</>
)

const examplesMenuItems = (
	<>
		<Menu.Item title="Auto" to="auto" />

		<Menu.Item title="Homepage" to="homepage" />
		<Menu.Item title="Brand" to="brand" />
		<Menu.Item title="Chat" to="chat" />

		<Menu.Item title="Seq ids" to="seq/list" />
		<Menu.Item title="Quiz" to="quiz" />
		<Menu.Item title="Foo" to="random/foo" />
		<Menu.Item title="Tenant" to="tenant/users" />
		<Menu.Item title="Nested Path" to="nested/path" />

		<Menu.Item title="Inactive" />

		<Menu.Item icon={<ListTreeIcon />} title="Nesting">
			<Menu.Item title="Foo Bar">
				<Menu.Item title="Skip this1" />
				<Menu.Item title="Foo Bar 1" to="random/fooBar1" />
				<Menu.Item title="Skip this1" />
			</Menu.Item>
			<Menu.Item title="Foo Bar 2" to="random/fooBar2">
				<Menu.Item title="Skip this1" />
				<Menu.Item title="Foo Bar Baz 1" to="random/fooBarBaz1" />
				<Menu.Item title="Skip this1" />
				<Menu.Item title="Foo Bar Baz 2" to="random/fooBarBaz2" />
				<Menu.Item title="Skip this1" />
			</Menu.Item>

			<Menu.Item title="Foo Bar 3" to="random/fooBar3">
				<Menu.Item title="Skip this" />
				<Menu.Item title="Skip this" />
				<Menu.Item title="Skip this1" />
				<Menu.Item title="Foo Bar Baz 4" to="random/fooBarBaz4">
					<Menu.Item title="Skip this1" />
					<Menu.Item title="Foo Bar 4" to="random/fooBar4">
						<Menu.Item title="Foo Bar Baz 5" to="random/fooBarBaz5" />
						<Menu.Item title="Skip this1" />
						<Menu.Item title="Foo Bar Baz 6" to="random/fooBarBaz6" />
						<Menu.Item title="Skip this1" />
					</Menu.Item>
					<Menu.Item title="Skip this1" />
				</Menu.Item>
			</Menu.Item>

			<Menu.Item title="Foo Bar 3" to="random/fooBar3">
				<Menu.Item title="Skip this1" />
				<Menu.Item title="Foo Bar Baz 3" to="random/fooBarBaz3" />
				<Menu.Item title="Skip this1" />
				<Menu.Item title="Foo Bar Baz 4" to="random/fooBarBaz4">
					<Menu.Item title="Skip this" />
					<Menu.Item title="Do not skip this!">
						<Menu.Item title="Foo Bar Baz 5" to="random/fooBarBaz5" />
						<Menu.Item title="Skip this1" />
						<Menu.Item title="Foo Bar Baz 6" to="random/fooBarBaz6" />
						<Menu.Item title="Skip this1" />
					</Menu.Item>
					<Menu.Item title="Skip this1" />
				</Menu.Item>
			</Menu.Item>
			<Menu.Item title="Skip this1" />
			<Menu.Item title="Bar" to="random/bar" />
			<Menu.Item title="Skip this1" />
			<Menu.Item title="Foo Bar" to="random/fooBar" />
			<Menu.Item title="Lorem" to="lorem">
				<Menu.Item title="Skip this1" />
				<Menu.Item title="Bar 2" to="random/bar">
					<Menu.Item title="Skip this1" />
					<Menu.Item title="Bar 3" to="random/bar" />
					<Menu.Item title="Skip this1" />
				</Menu.Item>
			</Menu.Item>
			<Menu.Item title="Skip this1" />
		</Menu.Item>
		<Menu.Item title="Other">
			<Menu.Item title="Skip this1" />
			<Menu.Item title="Bar 4" to="random/bar" />
			<Menu.Item title="Skip this1" />
		</Menu.Item>
	</>
)

const settingsMenuItems = (
	<>
		<Menu.Item title="Locales" to="settings/locales" />
	</>
)

export const HorizontalNavigation = () => (
	<HorizontalMenu>
		<HorizontalMenu.Item icon={<LayoutDashboardIcon />} title="Dashboard" to="index" />
		<HorizontalMenu.Item icon={<NewspaperIcon />} title="Articles">
			<Menu>
				<Menu.Item title="List" to="articles" />
				{articlesMenuItems}
			</Menu>
		</HorizontalMenu.Item>
		<HorizontalMenu.Item icon={<ComponentIcon />} title="Components">
			<Menu>
				{componentsMenuItems}
			</Menu>
		</HorizontalMenu.Item>
		<HorizontalMenu.Item icon={<FileTextIcon />} title="Examples">
			<Menu>
				{examplesMenuItems}
			</Menu>
		</HorizontalMenu.Item>
		<HorizontalMenu.Item title="Settings">
			<Menu>
				{settingsMenuItems}
			</Menu>
		</HorizontalMenu.Item>
	</HorizontalMenu>
)

export const Navigation = () => (
	<Menu id="sandbox-menu" label="Sandbox project">
		<Menu.Item icon={<LayoutDashboardIcon />} title="Dashboard" to="index" />
		<Menu.Item icon={<NewspaperIcon />} title="Articles" to="articles">{articlesMenuItems}</Menu.Item>
		<Menu.Item icon={<ComponentIcon />} title="Components">{componentsMenuItems}</Menu.Item>
		<Menu.Item icon={<FileTextIcon />} title="Examples">{examplesMenuItems}</Menu.Item>
		<Menu.Item title="Settings">{settingsMenuItems}</Menu.Item>
	</Menu>
)
