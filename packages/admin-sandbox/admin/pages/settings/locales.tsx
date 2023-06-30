import { MultiEditScope, NavigateBackLink, PersistButton, TextField } from '@contember/admin'
import { Title } from '../../components/Directives'
import { SlotSources } from '../../components/Slots'

export default () => (
	<>
		<Title>Languages</Title>
		<SlotSources.Back><NavigateBackLink to="settings">Back</NavigateBackLink></SlotSources.Back>

		<MultiEditScope entities="Locale" listProps={{ beforeContent: <SlotSources.Actions><PersistButton /></SlotSources.Actions> }}>
			<TextField label="Code" field="code" />
			<TextField label="Label" field="label" />
		</MultiEditScope>
	</>
)
