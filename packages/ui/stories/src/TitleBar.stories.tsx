import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { AnchorButton, Button, TitleBar, TitleBarProps } from '../../src'
import { disabledControlsForAttributes, stringControl } from './Helpers'

export default {
	title: 'Layout/TitleBar',
	component: TitleBar,
	argTypes: {
		...disabledControlsForAttributes<typeof TitleBar>('actions', 'navigation'),
		children: stringControl(),
	},
} as ComponentMeta<typeof TitleBar>


const Template: ComponentStory<typeof TitleBar> = (args: TitleBarProps) => (
	<div style={{
		'--cui-layout-page--padding-top': '1em',
		'--cui-layout-page--padding-left': '1em',
		'--cui-layout-page--padding-right': '1em',
		'--cui-layout-section-gap': '0.5em',
		'flex': 1,
	} as React.HTMLAttributes<HTMLDivElement['style']>}>
		<TitleBar {...args} />
	</div>
)

export const Default = Template.bind({})

Default.args = {
	actions: <Button scheme="dark">Save</Button>,
	navigation: <AnchorButton distinction="seamless">&larr; Back</AnchorButton>,
	children: 'Lorem ipsum',
	after: 'This is added after...',
}
