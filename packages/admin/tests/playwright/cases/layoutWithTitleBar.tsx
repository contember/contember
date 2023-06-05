import { Button, Layout, LayoutPage, Stack } from '../../../src'

const navigation = (
	<div style={{ backgroundColor: 'yellow', width: '100%' }}>Navigation</div>
)

const side = (
	<div style={{ backgroundColor: 'orange', width: '100%' }}>Side</div>
)

const afterTitle = (
	<Stack direction="horizontal">
		<span>Lorem</span>
		<span>ipsum</span>
		<span>dolor</span>
		<span>sit</span>
		<span>amet</span>
	</Stack>
)

const action = (
	<Button distinction="primary">Save</Button>
)

const back = (
	<a href="#">Back</a>
)

export default function () {
	return (
		<Layout scheme="system" navigation={navigation}>
			<LayoutPage
				actions={action}
				afterTitle={afterTitle}
				navigation={back}
				side={side}
				title={<h2 className="cui-heading">Lorem ipsum dolor sit amet</h2>}
			>
				<div style={{ backgroundColor: 'blue', width: '100%' }}>Content</div>
			</LayoutPage>
		</Layout>
	)
}
