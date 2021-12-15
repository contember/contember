import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { AnchorButton, Button, TitleBar } from '../../src'
import { disabledControlsForAttributes, stringControl } from './helpers'

export default {
	title: 'TitleBar',
	component: TitleBar,
	argTypes: {
		...disabledControlsForAttributes<typeof TitleBar>('actions', 'headingProps', 'navigation'),
		children: stringControl(),
	},
} as ComponentMeta<typeof TitleBar>


const Template: ComponentStory<typeof TitleBar> = args => <div style={{
	'--cui-layout-page-padding-top': '1em',
	'--cui-layout-page-padding-left': '1em',
	'--cui-layout-page-padding-right': '1em',
	'--cui-layout-section-gap': '0.5em',
	'flex': 1,
} as React.HTMLAttributes<HTMLDivElement['style']>}>
	<TitleBar {...args} />
</div>

export const Defaut = Template.bind({})

Defaut.args = {
	actions: <Button scheme="dark-below">Save</Button>,
	navigation: <AnchorButton distinction="seamless">&larr; Back</AnchorButton>,
	children: 'Lorem ipsum',
	after: 'This is added after...',
}
