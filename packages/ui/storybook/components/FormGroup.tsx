import { text } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { FormGroup } from '../../src'
import { sizeKnob } from '../utils/knobs'
import { SimpleTextInputStory } from './TextInput'

const FormGroupStory = () => {
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
			<SimpleTextInputStory size={size} validationState={error === '' ? undefined : 'invalid'} />
		</FormGroup>
	)
}

storiesOf('FormGroup', module).add('simple', () => <FormGroupStory />)
