import { boolean } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { memo } from 'react'
import { Aether, Box, RepeaterContainer } from '../../src'

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
				<RepeaterContainer heading="Boxes with">{loremIpsum}</RepeaterContainer>
				<RepeaterContainer heading="Only sections">{loremIpsum}</RepeaterContainer>
				<RepeaterContainer heading="Work just fine">{loremIpsum}</RepeaterContainer>
			</Box>
			<Box heading="Lorem ipsum">
				{loremIpsum}
				<RepeaterContainer heading="But there">{loremIpsum}</RepeaterContainer>
				<RepeaterContainer heading="Can also be">{loremIpsum}</RepeaterContainer>
				<RepeaterContainer heading="Top-level stuff">{loremIpsum}</RepeaterContainer>
			</Box>
			<Box heading="Let us">
				<RepeaterContainer heading="Put the nesting">{loremIpsum}</RepeaterContainer>
				<Box heading="To the test">
					<Box heading="And see">
						<RepeaterContainer heading="If all">{loremIpsum}</RepeaterContainer>
						<RepeaterContainer heading="Combinations">{loremIpsum}</RepeaterContainer>
					</Box>
					<RepeaterContainer heading="Actually">{loremIpsum}</RepeaterContainer>
					<Box heading="Render">
						<RepeaterContainer heading="Without any">{loremIpsum}</RepeaterContainer>
						<RepeaterContainer heading="Obvious flaws">{loremIpsum}</RepeaterContainer>
					</Box>
				</Box>
				<RepeaterContainer heading="Because that would be">{loremIpsum}</RepeaterContainer>
				<RepeaterContainer heading="Rather bad">{loremIpsum}</RepeaterContainer>
			</Box>
		</BoxStoryWrapper>
	))
