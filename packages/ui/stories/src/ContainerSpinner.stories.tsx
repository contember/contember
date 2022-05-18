import type { ComponentMeta, ComponentStory } from '@storybook/react'
import { ContainerSpinner } from '../../src'

export default {
	title: 'Misc/Container Spinner',
	component: ContainerSpinner,
} as ComponentMeta<typeof ContainerSpinner>

const Template: ComponentStory<typeof ContainerSpinner> = args => <ContainerSpinner {...args} />

export const Default = Template.bind({})
