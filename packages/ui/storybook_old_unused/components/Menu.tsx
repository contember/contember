import { storiesOf } from '@storybook/react'
import { Menu, Navigation } from '../../src'

storiesOf('Menu', module)
	.add('simple', () => {
		return (
			<Navigation.IsActiveContext.Provider value={(s: any) => s === '#active-page'}>
				<Menu>
					<Menu.Item>
						<Menu.Item title="Front page" to="#active-page" />
						<Menu.Item title="Pages">
							<Menu.Item title="List all" />
							<Menu.Item title="Add new" to="#active-page" />
						</Menu.Item>
					</Menu.Item>
					<Menu.Item title="Other">
						<Menu.Item title="External link" to="https://example.com" external />
						<Menu.Item title="Code of conduct" />
						<Menu.Item title="Terms and conditions" />
					</Menu.Item>
					<Menu.Item title="Experiments">
						<Menu.Item title="Depth test">
							<Menu.Item title="Ok">
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
						</Menu.Item>
						<Menu.Item title={<button type="button">Arbitrary JSX content</button>} />
						<Menu.Item title="Last item" to="#active-page" />
					</Menu.Item>
				</Menu>
			</Navigation.IsActiveContext.Provider>
		)
	})
	.add('design', () => {
		return (
			<Navigation.IsActiveContext.Provider value={(s: any) => s === '#active-page'}>
				<Menu>
					<Menu.Item title="Pages">
						<Menu.Item title="Front page" />
						<Menu.Item title="Posts" />
						<Menu.Item title="Pages" />
						<Menu.Item title="FAQs" />
						<Menu.Item title="Contacts" expandedByDefault>
							<Menu.Item title="Basic info & departments" to="#active-page" />
							<Menu.Item title="Sales regions" />
						</Menu.Item>
						<Menu.Item title="Front page" />
						<Menu.Item title="Posts" />
						<Menu.Item title="Pages" />
						<Menu.Item title="FAQs" />
						<Menu.Item title="Contacts" />
					</Menu.Item>
				</Menu>
			</Navigation.IsActiveContext.Provider>
		)
	})

	.add('design with caret', () => {
		return (
			<Navigation.IsActiveContext.Provider value={(s: any) => s === '#active-page'}>
				<Menu showCaret>
					<Menu.Item title="Pages">
						<Menu.Item title="Front page" />
						<Menu.Item title="Posts" />
						<Menu.Item title="Pages" />
						<Menu.Item title="FAQs" />
						<Menu.Item title="Contacts" expandedByDefault>
							<Menu.Item title="Basic info & departments" to="#active-page" />
							<Menu.Item title="Sales regions" />
						</Menu.Item>
						<Menu.Item title="Front page" />
						<Menu.Item title="Posts" />
						<Menu.Item title="Pages" />
						<Menu.Item title="FAQs" />
						<Menu.Item title="Contacts" />
					</Menu.Item>
				</Menu>
			</Navigation.IsActiveContext.Provider>
		)
	})
