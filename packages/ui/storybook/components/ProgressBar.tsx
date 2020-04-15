import { number } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { ProgressBar } from '../../src'

storiesOf('ProgressBar', module).add('simple', () => {
	const progress = number('Progress', 0.5, {
		range: true,
		min: 0,
		max: 1,
		step: 0.05,
	})

	return (
		<div style={{ width: '250px', fontSize: '3rem', margin: '2rem auto' }}>
			<ProgressBar progress={progress} />
		</div>
	)
})
