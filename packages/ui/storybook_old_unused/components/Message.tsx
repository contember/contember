import { boolean, radios, text } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { Message, MessageProps } from '../../src'
import { sizeKnob } from '../utils/knobs'

const renderMessage = (type: MessageProps['type']) => {
	const message = text('Message', `Lorem ipsum is ${type}!`)
	const lifted = boolean('Lifted', false)
	const distinction = radios<MessageProps['distinction']>(
		'Distinction',
		{
			Default: 'default',
			Striking: 'striking',
		},
		'default',
	)
	const flow = radios<MessageProps['flow']>(
		'Flow',
		{
			Default: 'default',
			Generous: 'generous',
			Block: 'block',
			GenerousBlock: 'generousBlock',
		},
		'default',
	)

	return (
		<Message type={type} size={sizeKnob()} flow={flow} lifted={lifted} distinction={distinction}>
			{message}
		</Message>
	)
}

storiesOf('Message', module)
	.add('default', () => renderMessage('default'))
	.add('success', () => renderMessage('success'))
	.add('danger', () => renderMessage('danger'))
	.add('info', () => renderMessage('info'))
	.add('warn', () => renderMessage('warn'))
