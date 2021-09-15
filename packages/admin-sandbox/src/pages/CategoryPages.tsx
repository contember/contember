import { MultiEditPage, TextField } from '@contember/admin'

export const CategoryPages = (
	<MultiEditPage pageName="categories" entities="Category">
		<TextField field={'name'} label={'Name'}/>
	</MultiEditPage>
)
