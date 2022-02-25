import { EditPage } from '@contember/admin'
import { AddContent } from '../components/AddContent'
import { ContentField } from '../components/ContentField'

export default (
	<EditPage entity="Homepage(unique = One)" setOnCreate="(unique = One)">
		<ContentField field="content" />
		<AddContent field="content" />
	</EditPage>
)
