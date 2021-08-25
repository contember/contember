import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { ContainerSpinner } from '../../src'

export default {
	title: 'ContainerSpinner',
	component: ContainerSpinner,
} as ComponentMeta<typeof ContainerSpinner>

const Template: ComponentStory<typeof ContainerSpinner> = args => <ContainerSpinner {...args} />

export const Default = Template.bind({})
