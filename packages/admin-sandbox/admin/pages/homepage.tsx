import { EditScope, PersistButton } from '@contember/admin'
import { AddContent } from '../components/AddContent'
import { ContentField } from '../components/ContentField'
import { Title } from '../components/Directives'
import { Slots } from '../components/Slots'

export default (
	<EditScope entity="Homepage(unique = One)" setOnCreate="(unique = One)">
		<Title>Home Page</Title>

		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

		<Slots.ContentStack>
			<ContentField field="content" />
			<AddContent field="content" />
		</Slots.ContentStack>
	</EditScope>
)
