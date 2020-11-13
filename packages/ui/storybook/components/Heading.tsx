import { number, radios, text } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Heading } from '../../src/components'
import { HeadingDepth } from '../../src/types'

const headingSizeKnob = (): 'small' | 'default' =>
	radios(
		'Size',
		{
			Small: 'small',
			Default: 'default',
		},
		'default',
	)

const headingDistinctionKnob = (): 'subtle' | 'default' =>
	radios(
		'Distinction',
		{
			Subtle: 'subtle',
			Default: 'default',
		},
		'default',
	)

storiesOf('Heading', module).add('simple', () => {
	const depth = number('Depth', 1, {
		step: 1,
		min: 1,
		max: 6,
		range: false,
	}) as HeadingDepth

	return (
		<Heading depth={depth} size={headingSizeKnob()} distinction={headingDistinctionKnob()}>
			{text('Text', 'Lorem ipsum dolor')}
		</Heading>
	)
})
