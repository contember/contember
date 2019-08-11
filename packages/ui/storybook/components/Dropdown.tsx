// import * as React from 'react'
// import { storiesOf } from '@storybook/react'
// import { Dropdown, PageLink } from '../../../cms-admin/src/components'
// import { DummyAdmin } from '../DummyAdmin'
//
// const ItemWithPageLink: React.FunctionComponent = ({ children }) => (
// 	<PageLink
// 		change={() => ({
// 			name: 'dashboard',
// 		})}
// 		Component={({ href, onClick }) => <Dropdown.Item {...{ href, onClick }}>{children}</Dropdown.Item>}
// 	/>
// )
//
// storiesOf('Dropdown', module)
// 	.add('simple', () => (
// 		<Dropdown>
// 			<Dropdown.Item>Potato</Dropdown.Item>
// 			<Dropdown.Item>Coconut</Dropdown.Item>
// 			<Dropdown.Item>Carrot</Dropdown.Item>
// 			<Dropdown.Item active>Active</Dropdown.Item>
// 		</Dropdown>
// 	))
// 	.add('dropdown w/ columns', () => (
// 		<Dropdown columns>
// 			<Dropdown.Column>
// 				<Dropdown.Item>Potato</Dropdown.Item>
// 				<Dropdown.Item>Coconut</Dropdown.Item>
// 				<Dropdown.Item>Carrot</Dropdown.Item>
// 				<Dropdown.Item>Very Long Label of This Thing</Dropdown.Item>
// 			</Dropdown.Column>
// 			<Dropdown.Column>
// 				<Dropdown.Item>Potato</Dropdown.Item>
// 				<Dropdown.Item>Coconut</Dropdown.Item>
// 				<Dropdown.Item>Carrot</Dropdown.Item>
// 			</Dropdown.Column>
// 		</Dropdown>
// 	))
// 	.add('dropdown w/ columns as PageLink', () => (
// 		<DummyAdmin>
// 			<Dropdown>
// 				<ItemWithPageLink>Potato</ItemWithPageLink>
// 				<ItemWithPageLink>Coconut</ItemWithPageLink>
// 				<ItemWithPageLink>Carrot</ItemWithPageLink>
// 			</Dropdown>
// 		</DummyAdmin>
// 	))
