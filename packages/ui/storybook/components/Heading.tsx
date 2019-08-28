import { radios, text } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Heading } from '../../src/components'
import { HeadingLevel } from '../../src/types'

storiesOf('Heading', module).add('without level', () => <Heading>{text('Text', 'Lorem ipsum dolor')}</Heading>)
storiesOf('Heading', module).add('with explicit level', () => {
	const level = radios<HeadingLevel>(
		'Level',
		{
			'1': 1,
			'2': 2,
			'3': 3,
			'4': 4,
			'5': 5,
			'6': 6,
		},
		1,
	)

	return <Heading level={level}>{text('Text', 'Lorem ipsum dolor')}</Heading>
})
