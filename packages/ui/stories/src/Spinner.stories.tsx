import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Aether, Spinner } from '../../src'

export default {
	title: 'Spinner',
	component: Spinner,
	decorators: [
		Story => (<>
			<p>Default spinner:</p>
			<Aether style={{ display: 'flex', gap: '1em', justifyContent: 'flex-start', padding: '2em' }}>
					<Story />
			</Aether>

      <p>Spinner inheriting color:</p>
			<Aether style={{ color: 'blue', display: 'flex', gap: '1em', justifyContent: 'flex-start', padding: '2em' }}>
					<Story />
			</Aether>

			<p>Spinner inheriting color &amp; size:</p>
			<Aether style={{ color: 'red', display: 'flex', fontSize: '4em', gap: '1em', justifyContent: 'flex-start', padding: '2em' }}>
					<Story />
			</Aether>
			</>
		),
	],
} as ComponentMeta<typeof Spinner>

const Template: ComponentStory<typeof Spinner> = args => <Spinner />

export const Defaut = Template.bind({})
