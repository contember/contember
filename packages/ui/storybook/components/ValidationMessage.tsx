import { boolean, radios, text } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { ValidationMessage, ValidationMessageProps } from '../../src'
import { sizeKnob } from '../utils/knobs'

const renderMessage = (type: ValidationMessageProps['type']) => {
	const message = text('Message', `Lorem ipsum is ${type}!`)
	const framed = boolean('Framed', false)
	const lifted = boolean('Lifted', false)
	const flow: ValidationMessageProps['flow'] = radios(
		'Flow',
		{
			Default: 'default',
			Generous: 'generous',
			Block: 'block',
		},
		'default',
	)

	return (
		<ValidationMessage type={type} size={sizeKnob()} flow={flow} framed={framed} lifted={lifted}>
			{message}
		</ValidationMessage>
	)
}

storiesOf('ValidationMessage', module)
	.add('valid', () => renderMessage('valid'))
	.add('invalid', () => renderMessage('invalid'))
	.add('info', () => renderMessage('info'))
	.add('neutral', () => renderMessage('neutral'))
	.add('warning', () => renderMessage('warning'))
