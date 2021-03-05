import { storiesOf } from '@storybook/react'
import { SaveControl } from '../../src'

storiesOf('SaveControl', module)
	.add('default', () => <SaveControl />)
	.add('custom label', () => <SaveControl primaryAction="Custom label" />)
	.add('popup content', () => (
		<SaveControl>
			<p>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis nec ultrices neque. Suspendisse a ipsum eu dolor
				porttitor tincidunt. Quisque sed luctus urna, eu cursus nulla.
			</p>
			<p>
				Aliquam erat volutpat. Praesent vitae ex a urna porta dictum tincidunt in diam. Lorem ipsum dolor sit amet,
				consectetur adipiscing elit.
			</p>
		</SaveControl>
	))
