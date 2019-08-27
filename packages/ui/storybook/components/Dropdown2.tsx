import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Dropdown2 } from '../../src'
import { useCallback, useState } from 'react'

const Component = () => {
	const [isOpen, setIsOpen] = useState(false)
	const toggleIsOpen = useCallback(() => {
		setIsOpen(!isOpen)
	}, [isOpen])
	const close = useCallback(() => {
		setIsOpen(false)
	}, [])

	return (
		<Dropdown2
			isOpen={isOpen}
			handle={
				<button type="button" onClick={toggleIsOpen}>
					Handle
				</button>
			}
			onCloseRequest={close}
		>
			<div style={{ width: '100%' }}>
				Content
				<br />
				goes here
			</div>
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
