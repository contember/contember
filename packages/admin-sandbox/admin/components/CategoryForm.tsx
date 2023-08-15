import { Component, Repeater, SelectField, TextField } from '@contember/admin'

const categoriesLocalesContainerProps = { gap: false }

export const CategoryForm = Component(() => <>
	<TextField field={'name'} label={'Name'} />
	<Repeater field={'locales'} label={'Locales'} orderBy={'id'} containerComponentExtraProps={categoriesLocalesContainerProps}>
		<SelectField label={'Locale'} options={'Locale.code'} field={'locale'} createNewForm={<TextField field={'code'} label={'Locale code'} />} />
		<TextField field={'name'} label={'Name'} />
	</Repeater>
</>)
