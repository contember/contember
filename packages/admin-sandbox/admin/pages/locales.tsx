import { MultiEditScope, PersistButton, TextField } from '@contember/admin'
import { Title } from '../components/Directives'
import { Actions, Content } from '../components/Slots'

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
