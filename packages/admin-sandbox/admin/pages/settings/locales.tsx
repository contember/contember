import { MultiEditScope, NavigateBackLink, PersistButton, TextField } from '@contember/admin'
import { SlotSources } from '../../components/Slots'

export default () => (
	<>
		<SlotSources.Title>Languages</SlotSources.Title>
		<SlotSources.Back><NavigateBackLink to="settings">Back</NavigateBackLink></SlotSources.Back>

		<MultiEditScope entities="Locale" listProps={{ beforeContent: <SlotSources.Actions><PersistButton /></SlotSources.Actions> }}>
			<TextField label="Code" field="code" />
			<TextField label="Label" field="label" />
		</MultiEditScope>
	</>
)
