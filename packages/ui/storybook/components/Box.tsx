import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Aether, Box } from '../../src'

const BoxStoryWrapper = React.memo(props => <Aether style={{ padding: '2em' }}>{props.children}</Aether>)

const loremIpsum =
	'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Commodi consequatur dolor, doloribus esse expedita illum iste maxime, nam quam quos, ut veniam. Corporis dicta dignissimos eaque nam odio praesentium ut?'

storiesOf('Box', module)
	.add('simple', () => (
		<BoxStoryWrapper>
			<Box>{loremIpsum}</Box>
			<Box>{loremIpsum}</Box>
		</BoxStoryWrapper>
	))
	.add('with a heading', () => (
		<BoxStoryWrapper>
			<Box heading="Lorem ipsum">{loremIpsum}</Box>
		</BoxStoryWrapper>
	))
	.add('nesting', () => (
		<BoxStoryWrapper>
			<Box heading="Lorem ipsum">
				<Box heading="Dolor">
					{loremIpsum}
					<Box heading="Sit amet">{loremIpsum}</Box>
				</Box>
				<Box heading="Consectetur">{loremIpsum}</Box>
			</Box>
		</BoxStoryWrapper>
	))
	.add('stupidly deep nesting', () => (
		<BoxStoryWrapper>
			<Box heading="There is">
				<Box heading="Literally">
					<Box heading="No way">
						<Box heading="Anyone ever">
							<Box heading="Needs to nest">
								<Box heading="This deep">But hey, we support it!</Box>
							</Box>
						</Box>
					</Box>
				</Box>
			</Box>
		</BoxStoryWrapper>
	))
