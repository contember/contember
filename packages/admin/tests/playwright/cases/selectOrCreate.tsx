import { CreatePage, Layout, SelectField, TextField } from '../../../src'

export default function() {
	return (
		<Layout>
			<CreatePage entity="Article">
				<TextField id="pw-title" field="title" label="Title" />
				<SelectField
					field={'locale'}
					label={'Locale'}
					options={'Locale.code'}
					createNewForm={<TextField id="pw-locale-code" field="code" label="Code" />}
				/>
			</CreatePage>
		</Layout>
	)
}
