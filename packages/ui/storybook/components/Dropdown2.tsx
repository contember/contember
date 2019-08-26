import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Dropdown2 } from '../../src'

storiesOf('Dropdown2', module).add('simple', () => {
	return (
		<Dropdown2 isOpen={true} handle={<button type="button">Handle</button>}>
			<div style={{ width: '100%' }}>
				Content
				<br />
				goes here
			</div>
		</Dropdown2>
	)
})
