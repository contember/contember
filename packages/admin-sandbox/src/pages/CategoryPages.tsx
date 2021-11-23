import { MultiEditPage, TextField } from '@contember/admin'

export const CategoryPages = (
	<MultiEditPage pageName="categories" entities="Category" rendererProps={{
		title: 'Categories',
	}}>
		<TextField field={'name'} label={'Name'}/>
	</MultiEditPage>
)
