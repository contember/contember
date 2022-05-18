import type { ComponentMeta, ComponentStory } from '@storybook/react'
import { CSSProperties } from 'react'
import { Grid } from '../../src'
import { Block, disabledControlsForAttributes } from './Helpers'

export default {
	title: 'Layout/Grid',
	component: Grid,
	argTypes: {
		...disabledControlsForAttributes<typeof Grid>('children'),
	},
} as ComponentMeta<typeof Grid>

const style: CSSProperties = {
	flex: 1,
}

const Template: ComponentStory<typeof Grid> = args => <Grid {...args} style={style}>
	{args.children ?? <>
		<Block />
		<Block />
		<Block>Lorem ipsum</Block>
		<Block />
		<Block />
	</>}
</Grid>

export const Defaut = Template.bind({})

Defaut.args = {
	columnWidth: 120,
}

export const Many_children = Template.bind({})

Many_children.args = {
	columnWidth: 120,
	children: <>
		<Block />
		<Block />
		<Block />
		<Block>Lorem ipsum</Block>
		<Block />
		<Block />
		<Block />
		<Block />
		<Block />
		<Block />
		<Block />
		<Block />
	</>,
}
