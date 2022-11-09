import { Button, MultiEditPage, Repeater, RepeaterItem, RepeaterItemProps, SelectField, TextField } from '@contember/admin'

const CustomRepeaterItem = (props: RepeaterItemProps) => {
	return <>
		<Button onClick={() => props.createNewEntity(undefined, props.index)}>Add item</Button>
		<RepeaterItem {...props} />
	</>
}

export default () => (
	<MultiEditPage entities="Tag" rendererProps={{ title: 'Abcd' }}>
		<TextField field={'name'} label={'Name'} />
		<Repeater field={'locales'} label={'Locales'} sortableBy={'order'} itemComponent={CustomRepeaterItem}>
			<SelectField label={'Locale'} options={'Locale.code'} field={'locale'}
									 createNewForm={<TextField field={'code'} label={'Locale code'} />} />
			<TextField field={'name'} label={'Name'} />
		</Repeater>
	</MultiEditPage>
)
