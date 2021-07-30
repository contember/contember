import { boolean, radios } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { useState } from 'react'
import { Select } from '../../src/components'
import { sizeKnob } from '../utils/knobs'

export const SelectStory = () => {
	const [value, setValue] = useState('')

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
				{ value: '', label: 'Here', disabled: true },
				{ value: 'north', label: 'North' },
				{ value: 'south', label: 'South' },
				{ value: 'west', label: 'West' },
				{ value: 'east', label: 'East' },
			]}
		/>
	)
}

storiesOf('Select', module).add('simple', () => <SelectStory />)
