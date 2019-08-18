import { text } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { ValidationMessage, ValidationMessageProps } from '../../src'
import { sizeKnob } from '../utils/knobs'

const renderMessage = (type: ValidationMessageProps['type']) => {
	const message = text('Message', `Lorem ipsum is ${type}!`)

	return (
		<ValidationMessage type={type} size={sizeKnob()}>
			{message}
		</ValidationMessage>
	)
}

storiesOf('ValidationMessage', module)
	.add('valid', () => renderMessage('valid'))
	.add('invalid', () => renderMessage('invalid'))
