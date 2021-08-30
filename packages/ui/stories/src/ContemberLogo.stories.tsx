import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { ContemberLogo } from '../../src'

export default {
	title: 'ContemberLogo',
	parameters: {
    docs: {
      description: {
        component: 'Contember logo component sized using ems.',
      },
    },
  },
	component: ContemberLogo,
	argTypes: {
		size: {
			control: { type: 'range', min: 0, max: 10, step: 0.1 },
		},
		logotype: {
			control: { type: 'boolean' },
			defaultValue: true,
		},
	},
} as ComponentMeta<typeof ContemberLogo>

const Template: ComponentStory<typeof ContemberLogo> = args => <ContemberLogo {...args} />

export const Numeric = Template.bind({})
Numeric.args = {
	size: 1,
	logotype: true,
}

export const WithinText: ComponentStory<typeof ContemberLogo> = args => <p>
	…and <ContemberLogo {...args} /> within the text
</p>

export const DefaultSize: ComponentStory<typeof ContemberLogo> = args => {
	return <ContemberLogo {...args} size="default" />
}

export const SmallSize: ComponentStory<typeof ContemberLogo> = args => {
	return <ContemberLogo {...args} size="small" />
}

export const LargeSize: ComponentStory<typeof ContemberLogo> = args => {
	return <ContemberLogo {...args} size="large" />
}
