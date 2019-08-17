import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { ButtonGroup } from '../../src/components'
import { sizeKnob } from '../utils/knobs'
import { simpleButtonStory } from './Button'

storiesOf('ButtonGroup', module).add('simple', () => {
	const size = sizeKnob()

	return <ButtonGroup size={size}>{simpleButtonStory(size)}</ButtonGroup>
})
