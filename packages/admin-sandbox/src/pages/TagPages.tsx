import { MultiEditPage, TextField } from '@contember/admin'

export const TagPage = (
	<MultiEditPage pageName="tags" entities="Tag">
		<TextField field={'name'} label={'Name'}/>
	</MultiEditPage>
)
