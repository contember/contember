import { number, text, radios } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Button, ButtonProps } from '../../src'
import { allIntents, defaultToUndefined } from '../utils'

storiesOf('Button', module).add('simple', () => {
	const props: ButtonProps = {
		size: defaultToUndefined(
			radios(
				'Size',
				{
					Small: 'small',
					Default: 'default',
					Large: 'large',
				},
				'default',
			),
		),
		children: text('Text', 'Pretty button'),
	}

	return allIntents.map(intent => <Button intent={intent} {...props} />)
})
