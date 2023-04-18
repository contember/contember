import { Button, MultiEditScope, PersistButton, Repeater, RepeaterItem, RepeaterItemProps, SelectField, TextField } from '@contember/admin'
import { Actions, ContentStack, Title } from '../components/Layout'

const CustomRepeaterItem = (props: RepeaterItemProps) => {
	return <>
		<Button onClick={() => props.createNewEntity(undefined, props.index)}>Add item</Button>
		<RepeaterItem {...props} />
	</>
}

export default () => (
	<>
		<Title>Tags</Title>

		<ContentStack>
			<MultiEditScope entities="Tag" listProps={{ beforeContent: <Actions><PersistButton /></Actions> }}>
				<TextField field={'name'} label={'Name'} />
				<Repeater field={'locales'} label={'Locales'} sortableBy={'order'} itemComponent={CustomRepeaterItem}>
					<SelectField label={'Locale'} options={'Locale.code'} field={'locale'}
						createNewForm={<TextField field={'code'} label={'Locale code'} />} />
					<TextField field={'name'} label={'Name'} />
				</Repeater>
			</MultiEditScope>
		</ContentStack>
	</>
)
