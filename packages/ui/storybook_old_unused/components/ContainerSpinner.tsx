import { radios } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { ContainerSpinner } from '../../src'

storiesOf('ContainerSpinner', module).add('simple', () => (
	<ContainerSpinner
		size={radios(
			'Size',
			{
				Small: 'small',
				Default: 'default',
				Large: 'large',
			},
			'default',
		)}
	/>
))
