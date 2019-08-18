import { boolean, text } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { FormGroup, TextInput } from '../../src'
import { sizeKnob } from '../utils/knobs'

const FormGroupStory = () => {
	const [value, setValue] = React.useState('')
	const label = text('Label', 'Phone number')
	const size = sizeKnob()
	const labelDescription = text('Label description', 'We may need to contact you.')
	const description = text('Description', 'You may leave out the area code.')

	const error = text('Error', '')

	return (
		<FormGroup
			label={label}
			errors={[
				{
					key: error,
					message: error,
				},
			]}
			labelDescription={labelDescription}
			description={description}
			size={size}
		>
			<TextInput
				value={value}
				onChange={newValue => setValue(newValue)}
				allowNewlines={boolean('Allow newlines', false) as false}
				size={size}
				validationState={error ? 'invalid' : undefined}
			/>
		</FormGroup>
	)
}

storiesOf('FormGroup', module).add('simple', () => <FormGroupStory />)
