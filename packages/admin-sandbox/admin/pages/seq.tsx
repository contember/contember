import {
	AnchorButton,
	CreatePage,
	DataGridPage,
	DeleteEntityButton,
	EditPage,
	GenericCell,
	HasMany,
	LinkButton,
	Repeater,
	TextCell,
	TextField,
} from '@contember/admin'


export const list = (
	<DataGridPage entities={'SeqEntity'} rendererProps={{ actions: <LinkButton to={'seq/create'}>New entity</LinkButton> }}>
		<TextCell field={'value'}/>
		<GenericCell canBeHidden={false} justification="justifyEnd">
			<LinkButton to={`seq/edit(id: $entity.id)`} Component={AnchorButton}>Edit</LinkButton>
			<DeleteEntityButton title="Delete" immediatePersist={true} />
		</GenericCell>
	</DataGridPage>
)

export const create = (
	<CreatePage entity="SeqEntity" redirectOnSuccess="seq/edit(id: $entity.id)">
		<TextField field={'value'} label={'Value'}/>
	</CreatePage>
)

export const edit = (
	<EditPage entity="SeqEntity(id = $id)">
		<TextField field={'value'} label={'Value'}/>
		<Repeater field={'sub'} label={'Sub'} orderBy={undefined}>
			<TextField field={'value'} label={'Value sub'}/>
		</Repeater>
	</EditPage>
)
