import { radios } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { ButtonList } from '../../src/components/forms'
import { simpleButtonStory } from './Button'

storiesOf('ButtonList', module).add('simple', () => (
	<ButtonList
		flow={radios(
			'Flow',
			{
				Default: 'default',
				Inline: 'inline',
				Block: 'block',
			},
			'default',
		)}
	>
		{simpleButtonStory()}
	</ButtonList>
))
