import { MultiEditPage, TextField } from '@contember/admin'

export const TagPage = (
	<MultiEditPage pageName="tags" entities="Tag" rendererProps={{
		title: 'Abcd',
	}}>
		<TextField field={'name'} label={'Name'}/>
	</MultiEditPage>
)
