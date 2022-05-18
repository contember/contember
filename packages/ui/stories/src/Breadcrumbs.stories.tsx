import type { ComponentMeta, ComponentStory } from '@storybook/react'
import { Breadcrumbs } from '../../src'
import { disabledControlsForAttributes } from './Helpers'

export default {
	title: 'Navigation/Breadcrumbs',
	component: Breadcrumbs,
	argTypes: disabledControlsForAttributes<typeof Breadcrumbs>('items'),
} as ComponentMeta<typeof Breadcrumbs>

const Template: ComponentStory<typeof Breadcrumbs> = args => <Breadcrumbs {...args} />

export const Defaut = Template.bind({})

Defaut.args = {
  items: [<a key={0} href="#">Content</a>, <a key={1} href="#">Posts</a>, 'Edit post'],
}
