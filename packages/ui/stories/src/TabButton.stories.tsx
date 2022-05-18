import type { ComponentMeta, ComponentStory } from '@storybook/react'
import { TabButton } from '../../src'
import { booleanControl } from './Helpers'

export default {
	title: 'Navigation/TabButton',
	component: TabButton,
	argTypes: {
		isDisabled: booleanControl(false),
		isSelected: booleanControl(true),
	},
} as ComponentMeta<typeof TabButton>

const Template: ComponentStory<typeof TabButton> = args => <>
	<TabButton {...args} />
	<TabButton>Content</TabButton>
	<TabButton>Lorem ipsum dolor sit amet</TabButton>
	<TabButton>SEO</TabButton>
</>

export const Default = Template.bind({})

Default.args = {
	children: 'Home',
}
