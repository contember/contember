import { boolean, radios, text } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Button, ButtonProps } from '../../src'
import { Size } from '../../src/types'
import { allIntents, sizeKnob } from '../utils'

export const simpleButtonStory = (size?: Size) => {
	const content = text('Text', 'Pretty button')
	const props: ButtonProps = {
		size: size || sizeKnob(),
		disabled: boolean('Disabled', false),
		isLoading: boolean('Is loading', false),
		isActive: boolean('Is active', false),
		distinction: radios(
			'Distinction',
			{
				Default: 'default',
				Seamless: 'seamless',
				Outlined: 'outlined',
			},
			'default',
		),
		flow: radios(
			'Flow',
			{
				Default: 'default',
				Squarish: 'squarish',
				Generous: 'generous',
				Block: 'block',
			},
			'default',
		),
		children: content,
	}

	return allIntents.map(intent => <Button intent={intent} {...props} />)
}

storiesOf('Button', module).add('simple', () => {
	return simpleButtonStory()
})
