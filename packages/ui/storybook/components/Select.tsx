import { boolean, radios } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Select, SelectProps } from '../../src/components'
import { sizeKnob } from '../utils/knobs'

export const SelectStory = () => {
	const [value, setValue] = React.useState('')

	// The cast is frankly just TS inference being insufficient but in practice that won't matter as the value of
	// the 'allowNewlines' props will typically be a constant which TS handles just fine.
	return (
		<Select
			value={value}
			onChange={e => setValue(e.target.value)}
			size={sizeKnob()}
			readOnly={boolean('Read only', false)}
			distinction={radios(
				'Distinction',
				{
					Default: 'default',
					Seamless: 'seamless',
				},
				'default',
			)}
			validationState={radios(
				'Validation state',
				{
					Default: 'default',
					Valid: 'valid',
					Invalid: 'invalid',
				},
				'default',
			)}
			options={[
				{ value: 'north', label: 'North' },
				{ value: 'south', label: 'South' },
				{ value: 'west', label: 'West' },
				{ value: 'east', label: 'East' },
			]}
		/>
	)
}

storiesOf('Select', module).add('simple', () => <SelectStory />)
