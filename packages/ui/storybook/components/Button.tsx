import { boolean, radios, text } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Button, ButtonProps } from '../../src'
import { allIntents, defaultToUndefined } from '../utils'

storiesOf('Button', module).add('simple', () => {
	const content = text('Text', 'Pretty button')
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
		disabled: boolean('Disabled', false),
		distinction: defaultToUndefined(
			radios(
				'Distinction',
				{
					Default: 'default',
					Seamless: 'seamless',
					Outlined: 'outlined',
				},
				'default',
			),
		),
		children: content,
	}

	return allIntents.map(intent => <Button intent={intent} {...props} />)
})
