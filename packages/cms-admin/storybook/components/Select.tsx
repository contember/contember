import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Select } from '../../src/components/ui'

storiesOf('Select', module).add('simple', () => (
	<Select
		value="-1"
		options={[
			{ label: 'Disabled', value: '-1', disabled: true },
			{ label: 'One', value: '1' },
			{ label: 'Two', value: '2' }
		]}
	/>
))
