import { radios } from '@storybook/addon-knobs'
import type { Size } from '../../../src/types'

export const sizeKnob = (): Size | undefined =>
	radios(
		'Size',
		{
			Small: 'small',
			Default: 'default',
			Large: 'large',
		},
		'default',
	)
