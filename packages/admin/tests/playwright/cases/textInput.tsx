import { CreatePage, Layout, TextField } from '../../../src'

export default function() {
	return (
		<Layout>
			<CreatePage entity="Article">
				<TextField id="pw-title" field="title" label="Title" />
			</CreatePage>
		</Layout>
	)
}
