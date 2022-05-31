import { Component, MultiEditPage, Repeater, SelectField, TextField } from '@contember/admin'

export const CategoryForm = Component(() => <>
	<TextField field={'name'} label={'Name'} />
	<Repeater field={'locales'} label={'Locales'} orderBy={'id'}>
		<SelectField label={'Locale'} options={'Locale.code'} field={'locale'} createNewForm={<TextField field={'code'} label={'Locale code'} />} />
		<TextField field={'name'} label={'Name'} />
	</Repeater>
</>)

export default () => (
	<MultiEditPage entities="Category" rendererProps={{ title: 'Categories', sortableBy: 'order' }}>
		<CategoryForm/>
	</MultiEditPage>
)
