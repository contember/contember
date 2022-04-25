import { MultiEditPage, Repeater, SelectField, TextField } from '@contember/admin'

export default () => (
	<MultiEditPage entities="Tag" rendererProps={{ title: 'Abcd' }}>
		<TextField field={'name'} label={'Name'} />
		<Repeater field={'locales'} label={'Locales'} sortableBy={'order'}>
			<SelectField label={'Locale'} options={'Locale.code'} field={'locale'}
									 createNewForm={<TextField field={'code'} label={'Locale code'} />} />
			<TextField field={'name'} label={'Name'} />
		</Repeater>
	</MultiEditPage>
)
