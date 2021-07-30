import { radios } from '@storybook/addon-knobs'
import type { IconSize } from '../../../src/types'

export const iconSizeKnob = (): IconSize | undefined =>
	radios(
		'Size',
		{
			Small: 'small',
			Default: 'default',
			Large: 'large',
			Lowercase: 'lowercase',
		},
		'default',
	)
