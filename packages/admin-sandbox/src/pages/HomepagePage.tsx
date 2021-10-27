import { EditPage } from '@contember/admin'
import { ContentField } from '../components/ContentField'

export const HomepagePage = (
	<EditPage pageName="homepage" entity="Homepage(unique = One)">
		<ContentField field={'content'}/>
	</EditPage>
)
