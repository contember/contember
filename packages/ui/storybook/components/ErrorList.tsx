import { text } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { ErrorList } from '../../src'

storiesOf('ErrorList', module).add('simple', () => {
	const message = text('Error message', 'The field is invalid.')
	const messages = Array(5).fill(message)
	const errors = messages.map(message => ({
		key: message,
		message,
	}))

	return <ErrorList errors={errors} />
})
