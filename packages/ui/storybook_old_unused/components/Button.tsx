import { boolean, radios, text } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import type { ReactElement } from 'react'
import { Button, BaseButtonProps } from '../../src'
import type { Size } from '../../src/types'
import { allIntents, sizeKnob } from '../utils'

export const simpleButtonStory = (size?: Size): ReactElement => {
	const content = text('Text', 'Pretty button')
	const props: ButtonProps = {
		size: size || sizeKnob(),
		disabled: boolean('Disabled', false),
		isLoading: boolean('Is loading', false),
		isActive: boolean('Is active', false),
		bland: boolean('Is bland', false),
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
				Circular: 'circular',
				Generous: 'generous',
				Block: 'block',
				GenerousBlock: 'generousBlock',
			},
			'default',
		),
		justification: radios(
			'Justification',
			{
				Default: 'default',
				Start: 'justifyStart',
				Center: 'justifyCenter',
				End: 'justifyEnd',
			},
			'default',
		),
		children: content,
	}

	return (
		<>
			{allIntents.map((intent, i) => (
				<Button key={i} intent={intent} {...props} />
			))}
		</>
	)
}

storiesOf('Button', module).add('simple', () => {
	return simpleButtonStory()
})
