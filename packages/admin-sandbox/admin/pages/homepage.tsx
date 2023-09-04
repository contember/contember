import { Button, EditScope, PersistButton, useEntity } from '@contember/admin'
import { AddContent } from '../components/AddContent'
import { ContentField } from '../components/ContentField'
import { SlotSources } from '../components/Slots'

const DeleteBlocks = () => {
	const entity = useEntity()
	return <Button onClick={() => {
		Array.from(entity.getEntityList('content.blocks')).forEach(it => {
			it.getField('json').updateValue(JSON.stringify({
				'formatVersion': 1,
				'children': [{ 'type': 'paragraph', 'children': [{ text: '' }] }],
			}))
		})
		setTimeout(() => {
			entity.getEntityList('content.blocks').deleteAll()
		}, 10)

	}}>delete all</Button>
}

export default (
	<>
		<SlotSources.Title>Home Page</SlotSources.Title>
		<EditScope entity="Homepage(unique = One)" setOnCreate="(unique = One)">
			<ContentField field="content" />
			<AddContent field="content" />
			<DeleteBlocks />
			<SlotSources.Actions>
				<PersistButton />
			</SlotSources.Actions>
		</EditScope>
	</>
)
