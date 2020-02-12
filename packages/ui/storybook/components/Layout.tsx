import { storiesOf } from '@storybook/react'
import * as React from 'react'
import {
	Button,
	Layout,
	LayoutHeading,
	Trio,
	Breadcrumbs,
	ContentStatus,
	SaveControl,
	DimensionSwitcher,
	UserMiniControl,
} from '../../src/components'

storiesOf('Layout', module)
	.add('large placeholders', () => {
		return <Layout top="top" main="main" sideBar="sideBar" actions="actions" />
	})
	.add('placeholders', () => {
		return (
			<Layout
				topStart="topStart"
				topCenter="topCenter"
				topEnd="topEnd"
				sideBarStart="sideBarStart"
				sideBarCenter="sideBarCenter"
				sideBarEnd="sideBarEnd"
				mainStart="mainStart"
				mainCenter="mainCenter"
				mainEnd="mainEnd"
				actionsStart="actionsStart"
				actionsCenter="actionsCenter"
				actionsEnd="actionsEnd"
			>
				children
			</Layout>
		)
	})
	.add('some components', () => {
		return (
			<Layout
				topStart={<LayoutHeading label="My Admin" />}
				topCenter={
					<DimensionSwitcher
						dimensions={[
							{ key: 'site', label: 'Site', options: [{ value: 'cz', label: 'CZ', active: true }] },
							{
								key: 'lang',
								label: 'Language',
								options: [
									{ value: 'cz', label: 'CZ', active: true },
									{ value: 'en', label: 'EN', active: true },
									{ value: 'de', label: 'DE', active: false },
								],
							},
						]}
					/>
				}
				topEnd={<UserMiniControl />}
				sideBarStart="sideBarStart"
				sideBarCenter="sideBarCenter"
				sideBarEnd="sideBarEnd"
				mainStart={
					<div style={{ fontSize: 12, margin: '10px 0' }}>
						<Trio start={<Breadcrumbs items={[<a href="#">Posts</a>, 'Edit post']} />} end={<ContentStatus />} />
					</div>
				}
				mainCenter="mainCenter"
				mainEnd="mainEnd"
				actionsEnd={<SaveControl />}
			/>
		)
	})
