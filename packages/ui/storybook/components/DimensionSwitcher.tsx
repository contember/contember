import { storiesOf } from '@storybook/react'
import { DimensionSwitcher } from '../../src'

storiesOf('DimensionSwitcher', module).add('simple', () => (
	<DimensionSwitcher
		dimensions={[
			{ key: 'site', label: 'Site', options: [{ value: 'cz', label: 'CZ', active: true }] },
			{
				key: 'lang',
				label: 'Language',
				options: [
					{ value: 'cz', label: 'CZ', active: true },
					{ value: 'en', label: 'EN', active: true },
					{ value: 'de', label: 'DE', active: false },
				],
			},
		]}
	/>
))
