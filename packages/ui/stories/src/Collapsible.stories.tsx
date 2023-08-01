import type { ComponentMeta, ComponentStory } from '@storybook/react'
import { Collapsible } from '../../src'
import { booleanControl } from './Helpers'


export default {
	title: 'Containers/Collapsible',
	component: Collapsible,
	decorators: [
		Story => <>
			<p>Content before…</p>
			<Story />
			<p>Content after…</p>
		</>,
	],
	argTypes: {
		expanded: booleanControl(true),
	},
} as ComponentMeta<typeof Collapsible>

const Template: ComponentStory<typeof Collapsible> = args => <Collapsible {...args}>
	<div style={{ background: 'rgb(var(--cui-background-color--rgb-50))', borderRadius: '.5em', boxShadow: '0 .5em 5em rgba(0, 31, 91, .1)', overflow: 'auto', padding: '0 1em' }}>
		<h4>Collapsible content</h4>
		<p>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vel tincidunt lacus. Duis vestibulum, justo
			vitae blandit tristique, dui tellus luctus nisi, vitae venenatis nunc ligula ac leo. Aenean non turpis a
			velit ullamcorper ullamcorper.
		</p>
		<p>
			Nam sed bibendum risus. Phasellus quis dui quis tortor pretium tempor ullamcorper in felis. Nunc quam dui,
			tempor vel lacinia ut, pellentesque eget eros. Proin gravida auctor turpis sed pulvinar. Proin lacinia
			imperdiet purus eu lobortis.
		</p>
	</div>
</Collapsible>

export const Simple = Template.bind({})
Simple.args = {
	onTransitionEnd: () => console.log('Finished transition'),
	onClose: () => console.log('Now it is closed'),
	onOpen: () => console.log('Now it is open'),
}
