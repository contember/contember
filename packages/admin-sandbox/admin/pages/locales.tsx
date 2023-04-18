import { MultiEditScope, PersistButton, TextField } from '@contember/admin'
import { Actions, Content, Title } from '../components/Layout'

export default () => (
	<>
		<Title>Languages</Title>
		<Content>
			<MultiEditScope entities="Locale" listProps={{ beforeContent: <Actions><PersistButton /></Actions> }}>
				<TextField label="Code" field="code" />
				<TextField label="Label" field="label" />
			</MultiEditScope>
		</Content>
	</>
)
