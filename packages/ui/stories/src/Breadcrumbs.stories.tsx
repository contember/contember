import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Aether, Breadcrumbs } from '../../src'

export default {
	title: 'Breadcrumbs',
	component: Breadcrumbs,
	decorators: [
		Story => (
			<Aether style={{ display: 'flex', gap: '1em', justifyContent: 'flex-start', padding: '2em' }}>
					<Story />
			</Aether>
		),
	],
} as ComponentMeta<typeof Breadcrumbs>

const Template: ComponentStory<typeof Breadcrumbs> = args => <Breadcrumbs {...args} />

export const Defaut = Template.bind({})

Defaut.args = {
  items: [<a href="#">Content</a>, <a href="#">Posts</a>, 'Edit post'],
}
