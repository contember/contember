import { MultiEditPage, TextField } from '@contember/admin'

export default () => (
	<MultiEditPage entities="Locale" pageName="locales" rendererProps={{ title: 'Languages' }}>
		<TextField label="Code" field="code" />
		<TextField label="Label" field="label" />
	</MultiEditPage>
)
