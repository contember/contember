import { color, text, number } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Icon, IconProps } from '../../../src'
import { blueprintIconNames } from './blueprintIconNames'

storiesOf('Icon', module).add('simple', () => {
	const blueprintIcon = text('Blueprint icon name', 'chart') as IconProps['blueprintIcon'] // Cast is sort of ok since Blueprint icons can handle corrupted icon name
	const fontSize = number('Font size', 96, {
		range: true,
		min: 12,
		max: 160,
		step: 1,
	})
	const fontColor = color('Font color', '#000000')

	return (
		<div style={{ color: fontColor }}>
			<h1>Dynamic size</h1>
			<div
				style={{
					fontSize: `${fontSize / 16}rem`,
				}}
			>
				<Icon blueprintIcon={blueprintIcon} />
			</div>
			<hr />
			<h1>Predefined sizes:</h1>
			{[16, 24, 32, 48, 96].map(fontSize => (
				<div
					style={{
						fontSize: `${fontSize / 16}rem`,
					}}
					key={fontSize}
				>
					{fontSize}px: <Icon blueprintIcon={blueprintIcon} /> example
				</div>
			))}
			<hr />
			<h1>
				<a href="https://blueprintjs.com/docs/#icons" target="_blank" rel="noopener noreferrer">
					Blueprint icon names <Icon blueprintIcon="arrow-top-right" />
				</a>
			</h1>
			{blueprintIconNames.map(blueprintIcon => (
				<div key={blueprintIcon}>
					<Icon blueprintIcon={blueprintIcon} /> {blueprintIcon}
				</div>
			))}
		</div>
	)
})
