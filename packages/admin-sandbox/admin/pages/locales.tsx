import { MultiEditScope, PersistButton, TextField } from '@contember/admin'
import { Title } from '../components/Directives'
import { Slots } from '../components/Slots'

export default () => (
	<>
		<Title>Languages</Title>
		<Slots.Content>
			<MultiEditScope entities="Locale" listProps={{ beforeContent: <Slots.Actions><PersistButton /></Slots.Actions> }}>
				<TextField label="Code" field="code" />
				<TextField label="Label" field="label" />
			</MultiEditScope>
		</Slots.Content>
	</>
)
