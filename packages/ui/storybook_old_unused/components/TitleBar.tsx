import { text } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { Button, TitleBar } from '../../src/components'

storiesOf('TitleBar', module).add('simple', () => {
	const headingText = text('Heading text', 'Edit User')

	// There can obviously be more buttons. This is just an example
	const navigationText = text('Navigation text', '← All users')
	const action1Text = text('Button 1 text', 'Add a new user')
	const action2Text = text('Button 2 text', 'Delete this user')

	return (
		<TitleBar
			navigation={
				// This can contain any number of buttons but only buttons
				!!navigationText && (
					<Button size="small" distinction="seamless">
						{navigationText}
					</Button>
				)
			}
			actions={
				// This can contain any number of buttons but only buttons
				!!(action1Text || action1Text) && (
					<>
						{action1Text && <Button>{action1Text}</Button>}
						{action2Text && <Button intent="danger">{action2Text}</Button>}
					</>
				)
			}
		>
			{headingText}
		</TitleBar>
	)
})
