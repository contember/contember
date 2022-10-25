import { CreatePage, Layout, RadioField } from '../../../src'

export default function () {
	return (
		<Layout scheme="system">
			<CreatePage entity="Article">
				<RadioField
					field="status"
					label="Status"
					options={[{
						value: 'draft',
						label: 'Draft',
					}, {
						value: 'review',
						label: 'Review',
					}, {
						value: 'published',
						label: 'Published',
					}]}
				/>
			</CreatePage>
		</Layout>
	)
}
