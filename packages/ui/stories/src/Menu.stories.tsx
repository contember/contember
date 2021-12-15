import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { LayoutChrome, Menu, NavigationContext } from '../../src'
import { booleanControl } from './helpers'

export default {
	title: 'Menu',
	component: Menu,
	argTypes: {
		showCaret: booleanControl(true),
	},
} as ComponentMeta<typeof Menu>

const Template: ComponentStory<typeof Menu> = args => (
	<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' }}>
		<LayoutChrome
			navigation={
				<NavigationContext.Provider value={(to: any) => ({
					isActive: to === '#active-page',
					href: to,
					navigate: () => {
						location.href = to
					},
				})}>
					<Menu {...args}>
						<Menu.Item title="Front page" to="#active-page" />
						<Menu.Item title="Content">
							<Menu.Item title="Posts">
								<Menu.Item title="List all" to="#other-page" />
								<Menu.Item title="Categories" to="#other-page" />
								<Menu.Item title="Tags" to="#active-page" />
								<Menu.Item title="Add new" to="#other-page" />
							</Menu.Item>
							<Menu.Item title="Pages" to="#other-page" />
							<Menu.Item title="Add new" to="#active-page" />
						</Menu.Item>
						<Menu.Item title="Products">
							<Menu.Item title="List all" to="#other-page" />
							<Menu.Item title="Orders" to="#other-page" />
							<Menu.Item title="Clients" to="#active-page" />
							<Menu.Item title="Invoices" to="#other-page" />
							<Menu.Item title="Add new" to="#other-page" />
						</Menu.Item>
						<Menu.Item title="Other">
							<Menu.Item title="External link" to="https://example.com" external />
							<Menu.Item title="Code of conduct" to="#other-page" />
							<Menu.Item title="Terms and conditions" to="#other-page" />
						</Menu.Item>
						<Menu.Item title="Experiments">
							<Menu.Item title="Depth test">
								<Menu.Item title="Deeper 1" to="#other-page">
									<Menu.Item title="Too deep">
										<Menu.Item title="Even deeper" to="#active-page">
											<Menu.Item title="How far this can go?">
												<Menu.Item title="I'm scared">
													<Menu.Item title="So dark in here">
														<Menu.Item title="I don't feel safe anymore" />
														<Menu.Item title="Let me out!" />
													</Menu.Item>
												</Menu.Item>
											</Menu.Item>
										</Menu.Item>
									</Menu.Item>
								</Menu.Item>
								<Menu.Item title="Deeper 2" to="#other-page">
									<Menu.Item title="Too deep">
										<Menu.Item title="Even deeper" to="#active-page">
											<Menu.Item title="How far this can go?">
												<Menu.Item title="I'm scared">
													<Menu.Item title="So dark in here">
														<Menu.Item title="I don't feel safe anymore" />
														<Menu.Item title="Let me out!" />
													</Menu.Item>
												</Menu.Item>
											</Menu.Item>
										</Menu.Item>
									</Menu.Item>
								</Menu.Item>
								<Menu.Item title="Deeper 3" to="#other-page" />
							</Menu.Item>
							<Menu.Item title={<button type="button">Arbitrary JSX content</button>} />
							<Menu.Item title="Last item" to="#active-page" />
						</Menu.Item>
					</Menu>
				</NavigationContext.Provider>
			}
		>
		</LayoutChrome>
	</div>
)

export const Simple = Template.bind({})
Simple.args = {}
