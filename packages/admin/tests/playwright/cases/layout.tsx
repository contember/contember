import { Layout, LayoutPage } from '../../../src'

const navigation = (
	<div style={{ backgroundColor: 'yellow', width: '100%' }}>Navigation</div>
)

const side = (
	<div style={{ backgroundColor: 'orange', width: '100%' }}>Side</div>
)

export default function () {
	return (
		<Layout navigation={navigation}>
			<LayoutPage side={side}>
				<div style={{ backgroundColor: 'blue', width: '100%' }}>Content</div>
			</LayoutPage>
		</Layout>
	)
}
