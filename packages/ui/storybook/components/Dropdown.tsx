import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Dropdown } from '../../src'

const Component = () => {
	return (
		<Dropdown
			buttonProps={{
				children: 'Toggle',
			}}
		>
			<>Dropdown content goes here</>
		</Dropdown>
	)
}

storiesOf('Dropdown', module).add('simple', () => {
	return (
		<div style={{ display: 'flex' }}>
			<Component />
		</div>
	)
})
