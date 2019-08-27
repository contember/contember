import { boolean } from '@storybook/addon-knobs'
import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { ButtonGroup } from '../../src/components'
import { sizeKnob } from '../utils/knobs'
import { simpleButtonStory } from './Button'

storiesOf('ButtonGroup', module).add('simple', () => {
	const size = sizeKnob()

	return (
		<ButtonGroup size={size} isTopToolbar={boolean('Is top toolbar', false)}>
			{simpleButtonStory(size)}
		</ButtonGroup>
	)
})
