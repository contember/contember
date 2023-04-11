import { Component, MultiEditScope, PersistButton, Repeater, SelectField, TextField } from '@contember/admin'
import { Actions, Content, Title } from '../components/Layout'

export const CategoryForm = Component(() => <>
	<TextField field={'name'} label={'Name'} />
	<Repeater field={'locales'} label={'Locales'} orderBy={'id'}>
		<SelectField label={'Locale'} options={'Locale.code'} field={'locale'} createNewForm={<TextField field={'code'} label={'Locale code'} />} />
		<TextField field={'name'} label={'Name'} />
	</Repeater>
</>)

export default () => (
	// TODO: Implement `rendererProps={{  }}` for MultiEditScope
	<>
		<Title>Categories</Title>
		<Content>
			<MultiEditScope entities="Category" listProps={{
				sortableBy: 'order',
				beforeContent: <Actions><PersistButton /></Actions>,
			}}>
				<CategoryForm />
			</MultiEditScope>
		</Content>
	</>
)
