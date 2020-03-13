import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { EditorToolbar } from '../../src'

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

storiesOf('EditorToolbar', module)
	.add('default', () => (
		<EditorToolbar
			isActive
			groups={[
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
			]}
			restGroups={[
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
			]}
			scope="default"
		/>
	))
	.add('default with labels', () => (
		<EditorToolbar
			isActive
			showLabels
			groups={[
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
					],
				},
			]}
			scope="default"
		/>
	))
	.add('contextual', () => (
		<EditorToolbar
			isActive
			groups={[
				{
					buttons: [
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
			]}
			scope="contextual"
		/>
	))
