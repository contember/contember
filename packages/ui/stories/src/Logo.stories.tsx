import type { ComponentMeta, ComponentStory } from '@storybook/react'
import { ContemberLogoImage, Logo } from '../../src'
import { disabledControlsForAttributes, rangeControl } from './Helpers'

export default {
	title: 'Misc/Logo',
	parameters: {
    docs: {
      description: {
        component: 'Contember logo component sized using ems.',
      },
    },
  },
	component: Logo,
	argTypes: {
		size: rangeControl(0, 10, 0.1),
		...disabledControlsForAttributes('image'),
	},
	args: {
		image: <ContemberLogoImage />,
		children: 'Contember',
	},
} as ComponentMeta<typeof Logo>

const Template: ComponentStory<typeof Logo> = args => <Logo {...args} />

export const Numeric = Template.bind({})
Numeric.args = {
	size: 1,
}

export const WithinText: ComponentStory<typeof Logo> = args => <p>
	…and <Logo {...args} /> within the text
</p>

export const DefaultSize: ComponentStory<typeof Logo> = args => {
	return <Logo {...args} size="default" />
}

export const SmallSize: ComponentStory<typeof Logo> = args => {
	return <Logo {...args} size="small" />
}

export const LargeSize: ComponentStory<typeof Logo> = args => {
	return <Logo {...args} size="large" />
}
