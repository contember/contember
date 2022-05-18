import type { ComponentMeta, ComponentStory } from '@storybook/react'
import { Spinner } from '../../src'

export default {
	title: 'Misc/Spinner',
	component: Spinner,
} as ComponentMeta<typeof Spinner>

export const Defaut: ComponentStory<typeof Spinner> = () => <Spinner />

export const InheritColor: ComponentStory<typeof Spinner> = () => <div style={{ color: 'blue' }}>
	<Spinner />
</div>

export const InheritColorAndSize: ComponentStory<typeof Spinner> = () => <div style={{ color: 'red', fontSize: '4em' }}>
	<Spinner />
</div>
