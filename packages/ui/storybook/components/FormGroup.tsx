import { radios, text } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { ReactNode } from 'react'
import { ButtonGroup, FormGroup } from '../../src'
import { Size } from '../../src/types'
import { sizeKnob } from '../utils/knobs'
import { simpleButtonStory } from './Button'
import { SimpleTextInputStory } from './TextInput'

const FormGroupStory = (props: {
	label: string
	labelDescription: string
	description: string
	useLabelElement?: boolean
	children: (childrenProps: { size: Size | undefined; error: string }) => ReactNode
}) => {
	const label = text('Label', props.label)
	const size = sizeKnob()
	const labelDescription = text('Label description', props.labelDescription)
	const description = text('Description', props.description)

	const error = text('Error', '')

	return (
		<FormGroup
			label={label}
			errors={[
				{
					message: error,
				},
			]}
			labelDescription={labelDescription}
			labelPosition={radios(
				'Label position',
				{
					Default: 'default',
					Left: 'labelLeft',
					InlineLeft: 'labelInlineLeft',
				},
				'default',
			)}
			description={description}
			size={size}
			useLabelElement={props.useLabelElement}
		>
			{props.children({ size, error })}
		</FormGroup>
	)
}

storiesOf('FormGroup', module).add('text input', () => (
	<FormGroupStory
		label="Phone number"
		labelDescription="We may need to contact you."
		description="You may leave out the area code."
	>
		{({ size, error }) => <SimpleTextInputStory size={size} validationState={error === '' ? undefined : 'invalid'} />}
	</FormGroupStory>
))

storiesOf('FormGroup', module).add('button group', () => (
	<FormGroupStory
		label="Favorite button"
		labelDescription="Click on the prettiest."
		description="You have to choose one."
		useLabelElement={false}
	>
		{({ size }) => <ButtonGroup size={size}>{simpleButtonStory(size)}</ButtonGroup>}
	</FormGroupStory>
))
