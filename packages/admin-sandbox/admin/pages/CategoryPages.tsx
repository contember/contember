import { MultiEditPage, Repeater, SelectField, TextField } from '@contember/admin'

export const Categories = (
	<MultiEditPage entities="Category" rendererProps={{
		title: 'Categories',
	}}>
		<TextField field={'name'} label={'Name'}/>
		<Repeater field={'locales'} label={'Locales'} orderBy={'id'}>
			<SelectField label={'Locale'} options={'Locale.code'} field={'locale'} />
			<TextField field={'name'} label={'Name'} />
		</Repeater>
	</MultiEditPage>
)
