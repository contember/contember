import { boolean, radios, text } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { TextInput } from '../../src/components'
import { sizeKnob } from '../utils/knobs'

const SimpleTextInputStory = () => {
	const [value, setValue] = React.useState('')

	// The cast is frankly just TS inference being insufficient but in practice that won't matter as the value of
	// the 'allowNewlines' props will typically be a constant which TS handles just fine.
	return (
		<TextInput
			value={value}
			onChange={newValue => setValue(newValue)}
			allowNewlines={boolean('Allow newlines', false) as true}
			size={sizeKnob()}
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
			validationState={radios(
				'Validation state',
				{
					Default: 'default',
					Valid: 'valid',
					Invalid: 'invalid',
				},
				'default',
			)}
		/>
	)
}

storiesOf('TextInput', module).add('simple', () => <SimpleTextInputStory />)
