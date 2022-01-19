import { EditPage } from '@contember/admin'
import { ContentField } from '../components/ContentField'

export const Homepage = (
	<EditPage entity="Homepage(unique = One)">
		<ContentField field={'content'}/>
	</EditPage>
)
