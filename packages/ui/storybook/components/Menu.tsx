import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Menu } from '../../src'

storiesOf('Menu', module).add('simple', () => {
	return (
		<Menu>
			<Menu.Item>
				<Menu.Item title="Front page" to="#front-page" />
				<Menu.Item title="Pages">
					<Menu.Item title="List all" />
					<Menu.Item title="Add new" />
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
							<Menu.Item title="Even deeper">
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
				<Menu.Item
					title={
						<button type="button" style={{ border: '1px solid', padding: '0 4px' }}>
							Arbitrary JSX content
						</button>
					}
				/>
				<Menu.Item title="Last item" />
			</Menu.Item>
		</Menu>
	)
})
