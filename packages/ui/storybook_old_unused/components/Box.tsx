import { boolean } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { memo } from 'react'
import { Aether, Box, BoxSection } from '../../src'

const BoxStoryWrapper = memo(props => <Aether style={{ padding: '2em' }}>{props.children}</Aether>)

const loremIpsum = (
	<span>
		Lorem ipsum dolor sit amet, consectetur adipisicing elit. Commodi consequatur dolor, doloribus esse expedita illum
		iste maxime, nam quam quos, ut veniam. Corporis dicta dignissimos eaque nam odio praesentium ut?
	</span>
)

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
	.add('active', () => (
		<BoxStoryWrapper>
			<Box heading="Lorem ipsum" isActive={boolean('Is active', false)}>
				{loremIpsum}
			</Box>
			<Box heading="Dolor sit">{loremIpsum}</Box>
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
	.add('with sections', () => (
		<BoxStoryWrapper>
			<Box>
				<BoxSection heading="Boxes with">{loremIpsum}</BoxSection>
				<BoxSection heading="Only sections">{loremIpsum}</BoxSection>
				<BoxSection heading="Work just fine">{loremIpsum}</BoxSection>
			</Box>
			<Box heading="Lorem ipsum">
				{loremIpsum}
				<BoxSection heading="But there">{loremIpsum}</BoxSection>
				<BoxSection heading="Can also be">{loremIpsum}</BoxSection>
				<BoxSection heading="Top-level stuff">{loremIpsum}</BoxSection>
			</Box>
			<Box heading="Let us">
				<BoxSection heading="Put the nesting">{loremIpsum}</BoxSection>
				<Box heading="To the test">
					<Box heading="And see">
						<BoxSection heading="If all">{loremIpsum}</BoxSection>
						<BoxSection heading="Combinations">{loremIpsum}</BoxSection>
					</Box>
					<BoxSection heading="Actually">{loremIpsum}</BoxSection>
					<Box heading="Render">
						<BoxSection heading="Without any">{loremIpsum}</BoxSection>
						<BoxSection heading="Obvious flaws">{loremIpsum}</BoxSection>
					</Box>
				</Box>
				<BoxSection heading="Because that would be">{loremIpsum}</BoxSection>
				<BoxSection heading="Rather bad">{loremIpsum}</BoxSection>
			</Box>
		</BoxStoryWrapper>
	))
