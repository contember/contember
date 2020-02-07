import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Button, Layout, LayoutHeading } from '../../src/components'

storiesOf('Layout', module)
	.add('large placeholders', () => {
		return <Layout top="top" main="main" sideBar="sideBar" actions="actions"></Layout>
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
				topCenter="topCenter"
				topEnd="topEnd"
				sideBarStart="sideBarStart"
				sideBarCenter="sideBarCenter"
				sideBarEnd="sideBarEnd"
				mainStart="mainStart"
				mainCenter="mainCenter"
				mainEnd="mainEnd"
				actionsEnd={<Button>Save</Button>}
			></Layout>
		)
	})
