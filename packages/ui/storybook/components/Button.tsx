import { number, text } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Button, ButtonProps } from '../../src'
import { allIntents } from '../utils/intents'

storiesOf('Button', module).add('simple', () => {
	const fontSize = number('Font size', 16, {
		range: true,
		min: 16,
		max: 64,
		step: 1,
	})
	const props: ButtonProps = {
		children: text('Text', 'Pretty button'),
	}

	return (
		<div
			style={{
				fontSize: `${fontSize / 16}rem`,
			}}
		>
			{allIntents.map(intent => (
				<Button intent={intent} {...props} />
			))}
		</div>
	)
})
