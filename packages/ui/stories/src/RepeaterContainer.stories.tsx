import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Button, Icon, RepeaterContainer, Size } from '../../src'
import { disabledControlsForAttributes, enumControl, stringControl } from './helpers'

const sizes: Size[] = ['default', 'small', 'large']

export default {
	title: 'RepeaterContainer',
	component: RepeaterContainer,
	argTypes: {
		...disabledControlsForAttributes<typeof RepeaterContainer>('children', 'actions', 'dragHandleComponent'),
		gap: enumControl(sizes, 'inline-radio', 'default'),
		label: stringControl('Item label'),
	},
} as ComponentMeta<typeof RepeaterContainer>

const Template: ComponentStory<typeof RepeaterContainer> = args => <RepeaterContainer {...args} />

export const Defaut = Template.bind({})

Defaut.args = {
	children: <>
		<div>{'[input component]'}</div>
		<div>{'[input component]'}</div>
	</>,
	actions: <Button
		distinction="seamless"
		flow="circular"
		className="theme-grey-controls theme-danger-controls:hover"
	><Icon blueprintIcon="trash" /></Button>,
	dragHandleComponent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}
