import { boolean, radios } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { ButtonGroup, ButtonGroupProps } from '../../src/components'
import { sizeKnob } from '../utils/knobs'
import { simpleButtonStory } from './Button'

storiesOf('ButtonGroup', module).add('simple', () => {
	const size = sizeKnob()
	const orientation: ButtonGroupProps['orientation'] = radios(
		'Orientation',
		{
			Default: 'default',
			Horizontal: 'horizontal',
			Vertical: 'vertical',
		},
		'default',
	)
	const flow: ButtonGroupProps['flow'] = radios(
		'Flow',
		{
			Default: 'default',
			Block: 'block',
		},
		'default',
	)
	const isTopToolbar = boolean('Is top toolbar', false)

	return (
		<ButtonGroup size={size} orientation={orientation} flow={flow} isTopToolbar={isTopToolbar}>
			{simpleButtonStory(size)}
		</ButtonGroup>
	)
})
