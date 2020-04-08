import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { EditorToolbar, EditorToolbarLayout } from '../../src'

const icons: any[] = [
	'clock',
	'composedBlock',
	'contentLock',
	'download',
	'gallery',
	'horizontalLine',
	'image',
	'megaphone',
	'newNote',
	'person',
	'questionAnswer',
	'quote',
	'tipBox',
	'tipLink',
]

let i = 0

const groups1 = [
	{
		buttons: [
			{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
			{ contemberIcon: icons[i++ % icons.length], label: 'longer button label' },
		],
	},
	{
		buttons: [
			{
				contemberIcon: icons[i++ % icons.length],
				label: icons[i % icons.length],
				groups: [
					{
						buttons: [
							{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
							{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
							{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
							{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
						],
					},
				],
			},
			{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
			{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
			{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
			{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
		],
	},
	{
		buttons: [
			{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
			{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
			{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
		],
	},
]

const groups2 = [
	{
		buttons: [
			{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
			{ contemberIcon: icons[i++ % icons.length], label: 'longer button label' },
		],
	},
	{
		buttons: [
			{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
			{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
			{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
			{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
			{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
		],
	},
	{
		buttons: [
			{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
			{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
			{ contemberIcon: icons[i++ % icons.length], label: icons[i % icons.length] },
		],
	},
]

storiesOf('EditorToolbar', module)
	.add('bar', () => (
		<div style={{ margin: '300px 0', textAlign: 'center' }}>
			<EditorToolbar isActive groups={groups1} restGroups={groups2} scope="default" layout={EditorToolbarLayout.BAR} />
		</div>
	))
	.add('grid', () => (
		<div style={{ margin: '50px 0', textAlign: 'center' }}>
			<EditorToolbar
				isActive
				groups={groups1}
				restGroups={groups2}
				scope="default"
				layout={EditorToolbarLayout.GRID}
				showLabels
			/>
		</div>
	))
	.add('list', () => (
		<div style={{ margin: '50px 0', textAlign: 'center' }}>
			<EditorToolbar
				isActive
				groups={groups1}
				restGroups={groups2}
				scope="default"
				layout={EditorToolbarLayout.LIST}
				showLabels
			/>
		</div>
	))
	.add('bar with labels', () => (
		<div style={{ margin: '300px 0', textAlign: 'center' }}>
			<EditorToolbar isActive showLabels groups={groups1} scope="default" restGroups={groups2} />
		</div>
	))
	.add('contextual', () => (
		<div style={{ margin: '300px 0', textAlign: 'center' }}>
			<EditorToolbar isActive groups={groups1} restGroups={groups2} scope="contextual" />
		</div>
	))
