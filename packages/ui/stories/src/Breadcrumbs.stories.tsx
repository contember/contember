import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Breadcrumbs } from '../../src'
import { disabledControlsForAttributes } from './Helpers'

export default {
	title: 'Breadcrumbs',
	component: Breadcrumbs,
	argTypes: disabledControlsForAttributes<typeof Breadcrumbs>('items'),
} as ComponentMeta<typeof Breadcrumbs>

const Template: ComponentStory<typeof Breadcrumbs> = args => <Breadcrumbs {...args} />

export const Defaut = Template.bind({})

Defaut.args = {
  items: [<a href="#">Content</a>, <a href="#">Posts</a>, 'Edit post'],
}
