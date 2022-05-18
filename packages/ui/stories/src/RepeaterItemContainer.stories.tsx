import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Button, Icon, RepeaterItemContainer, Size } from '../../src'
import { Block, disabledControlsForAttributes, enumControl, stringControl } from './Helpers'

const sizes: Size[] = ['default', 'small', 'large']

export default {
	title: 'Containers/RepeaterItemContainer',
	component: RepeaterItemContainer,
	argTypes: {
		...disabledControlsForAttributes<typeof RepeaterItemContainer>('children', 'actions', 'dragHandleComponent'),
		gap: enumControl(sizes, 'inline-radio', 'default'),
		label: stringControl('Item label'),
	},
} as ComponentMeta<typeof RepeaterItemContainer>

const Template: ComponentStory<typeof RepeaterItemContainer> = args => <RepeaterItemContainer {...args} />

export const Defaut = Template.bind({})

Defaut.args = {
	children: <>
		<Block />
		<Block />
		<Block />
		<Block />
		<Block />
	</>,
	actions: <Button
		distinction="seamless"
		flow="circular"
		className="theme-grey-controls theme-danger-controls:hover"
	><Icon blueprintIcon="trash" /></Button>,
	dragHandleComponent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}
