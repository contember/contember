import { boolean, radios, text } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { useState } from 'react'
import { TextInput, TextInputOwnProps } from '../../src/components'
import { sizeKnob } from '../utils/knobs'

export interface SimpleTextInputStoryProps {
	size?: TextInputOwnProps['size']
	validationState?: TextInputOwnProps['validationState']
}

export const SimpleTextInputStory = ({ size, validationState }: SimpleTextInputStoryProps) => {
	const [value, setValue] = useState('')

	// The cast is frankly just TS inference being insufficient but in practice that won't matter as the value of
	// the 'allowNewlines' props will typically be a constant which TS handles just fine.
	return (
		<TextInput
			value={value}
			onChange={e => setValue(e.target.value)}
			allowNewlines={boolean('Allow newlines', false) as true}
			size={size || sizeKnob()}
			placeholder={text('Placeholder', 'Placeholder text')}
			readOnly={boolean('Read only', false)}
			distinction={radios(
				'Distinction',
				{
					Default: 'default',
					Seamless: 'seamless',
				},
				'default',
			)}
			validationState={
				validationState ||
				radios(
					'Validation state',
					{
						Default: 'default',
						Valid: 'valid',
						Invalid: 'invalid',
					},
					'default',
				)
			}
			withTopToolbar={boolean('With top toolbar', false)}
		/>
	)
}

storiesOf('TextInput', module).add('simple', () => <SimpleTextInputStory />)
