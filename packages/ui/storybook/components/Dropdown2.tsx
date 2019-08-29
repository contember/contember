import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Dropdown2 } from '../../src'

const Component = () => {
	return (
		<Dropdown2
			buttonProps={{
				children: 'Toggle',
			}}
		>
			Dropdown content goes here
		</Dropdown2>
	)
}

storiesOf('Dropdown2', module).add('simple', () => {
	return (
		<div style={{ display: 'flex' }}>
			<Component />
		</div>
	)
})
