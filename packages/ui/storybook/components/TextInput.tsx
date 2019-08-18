import { boolean, text } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { TextInput } from '../../src/components'
import { sizeKnob } from '../utils/knobs'

const SimpleTextInputStory = () => {
	const [value, setValue] = React.useState('')
	const allowNewlines = boolean('Allow newlines', false)
	const size = sizeKnob()
	const placeholder = text('Placeholder', 'Placeholder text')

	// The cast is frankly just TS inference being insufficient but in practice that won't matter as the value of
	// the 'allowNewlines' props will typically be a constant which TS handles just fine.
	return (
		<TextInput
			value={value}
			onChange={newValue => setValue(newValue)}
			size={size}
			allowNewlines={allowNewlines as true}
			placeholder={placeholder}
		/>
	)
}

storiesOf('TextInput', module).add('simple', () => <SimpleTextInputStory />)
