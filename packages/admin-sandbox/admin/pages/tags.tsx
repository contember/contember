import { MultiEditPage, Repeater, SelectField, TextField } from '@contember/admin'

export default () => (
	<MultiEditPage entities="Tag" rendererProps={{ title: 'Abcd' }}>
		<TextField field={'name'} label={'Name'} />
		<Repeater field={'locales'} label={'Locales'} sortableBy={'order'}>
			<TextField field={'name'} label={'Name'} />
			<SelectField label={'Locale'} options={'Locale.code'} field={'locale'} />
		</Repeater>
	</MultiEditPage>
)
