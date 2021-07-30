import { number } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { Spinner } from '../../src'

storiesOf('Spinner', module).add('simple', () => {
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
			<Spinner />
		</div>
	)
})
