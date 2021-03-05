import { storiesOf } from '@storybook/react'
import { ActionableBox } from '../../src'

const loremIpsum =
	'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequatur provident, quis? Ad adipisci dolore ipsam\n' +
	'magnam modi nostrum optio quia velit! Ab aperiam consequatur consequuntur deleniti iusto libero possimus\n' +
	'tpraesentium.'

storiesOf('ActionableBox', module).add('simple', () => (
	<div style={{ border: '1px dashed grey', width: '200px', minHeight: '200px' }}>
		<ActionableBox editContents={<>{loremIpsum}</>} onRemove={() => alert('Removed!')}>
			{loremIpsum}
		</ActionableBox>
	</div>
))
