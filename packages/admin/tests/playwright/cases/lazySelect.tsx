import { CreatePage, Layout, SelectField, TextField } from '../../../src'

export default function() {
	return (
		<Layout>
			<CreatePage entity="Article">
				<TextField id="pw-title" field="title" label="Title" />
				<SelectField
					field={'category'}
					label={'Category'}
					fuseOptions={false}
					options={{
						fields: 'Category.name',
						orderBy: 'name asc',
					}}
					lazy={{ limit: 1 }}
				/>
			</CreatePage>
		</Layout>
	)
}
