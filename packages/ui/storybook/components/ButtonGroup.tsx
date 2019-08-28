import { boolean } from '@storybook/addon-knobs'
import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { ButtonGroup } from '../../src/components'
import { sizeKnob } from '../utils/knobs'
import { simpleButtonStory } from './Button'

storiesOf('ButtonGroup', module).add('simple', () => {
	const size = sizeKnob()
	const isVertical = boolean('Is vertical', false)
	const isTopToolbar = boolean('Is top toolbar', false)

	return (
		<ButtonGroup size={size} isVertical={isVertical} isTopToolbar={isTopToolbar}>
			{simpleButtonStory(size)}
		</ButtonGroup>
	)
})
