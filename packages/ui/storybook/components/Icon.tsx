import { number } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Icon } from '../../src'

storiesOf('Icon', module).add('simple', () => {
	const fontSize = number('Font size', 16, {
		range: true,
		min: 16,
		max: 160,
		step: 1,
	})

	return (
		<div
			style={{
				fontSize: `${fontSize / 16}rem`,
			}}
		>
			<Icon />
		</div>
	)
})
