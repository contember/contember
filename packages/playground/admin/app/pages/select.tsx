import { Slots } from '@app/lib/layout'
import { Binding, PersistButton } from '@app/lib/binding'
import { EntitySubTree, Link } from '@contember/interface'
import * as React from 'react'
import { Field, useEnvironment } from '@contember/react-binding'
import { InputField, MultiSelectField, SelectEnumField, SelectField, SortableMultiSelectField } from '@app/lib/form'
import { AnchorButton } from '@app/lib/ui/button'


export const HasOne = () => {
	const required = !!useEnvironment().getParameterOrElse('required', false)
	return <>
		<Binding>
			<Slots.Actions>
				<PersistButton />
			</Slots.Actions>
			<EntitySubTree entity={'SelectRoot(unique=unique)'} setOnCreate={'(unique=unique)'}>
				<div className={'space-y-4'}>
					<ToggleRequired />
					<InputField field="dummy" label="Dummy to trigger dirty state" />
					<SelectField field={'hasOne'} label="Has one value" initialSorting={{ name: 'asc' }} required={required}>
						<Field field={'name'} />
					</SelectField>
				</div>
			</EntitySubTree>
		</Binding>
	</>
}
export const hasMany = () => <>
	<Binding>
		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>
		<EntitySubTree entity={'SelectRoot(unique=unique)'} setOnCreate={'(unique=unique)'}>
			<div className={'space-y-4'}>
				<InputField field="dummy" label="Dummy to trigger dirty state" />
				<MultiSelectField field={'hasMany'} label="Has many values">
					<Field field={'name'} />
				</MultiSelectField>
			</div>
		</EntitySubTree>
	</Binding>
</>
export const hasManySortable = () => <>
	<Binding>
		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>
		<EntitySubTree entity={'SelectRoot(unique=unique)'} setOnCreate={'(unique=unique)'}>
			<div className={'space-y-4'}>
				<InputField field="dummy" label="Dummy to trigger dirty state" />
				<SortableMultiSelectField field={'hasManySorted'} connectAt={'value'} sortableBy={'order'} label="Has many sortable values">
					<Field field={'name'} />
				</SortableMultiSelectField>
			</div>
		</EntitySubTree>
	</Binding>
</>

export const createNewForm = () => <>
	<Binding>
		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>
		<EntitySubTree entity={'SelectRoot(unique=unique)'} setOnCreate={'(unique=unique)'}>
			<div className={'space-y-4'}>
				<SelectField
					field={'hasOne'}
					label="Has one value"
					createNewForm={<>
						<InputField field="name" label="Name" />
						<InputField field="slug" label="Slug" />
					</>}
				>
					<Field field={'name'} />
				</SelectField>
			</div>
		</EntitySubTree>
	</Binding>
</>

export const EnumSelect = () => {
	const required = !!useEnvironment().getParameterOrElse('required', false)
	return <>
		<Binding>
			<Slots.Actions>
				<PersistButton />
			</Slots.Actions>
			<EntitySubTree entity={'InputRoot(unique=unique)'} setOnCreate={'(unique=unique)'}>
				<div className={'space-y-4'}>
					<ToggleRequired />
					<InputField field="dummy" label="Dummy to trigger dirty state" />
					<SelectEnumField field={'enumValue'} label={'Some enum'} options={{
						a: 'Option A',
						b: 'Option B',
						c: 'Option C',
					}} required={required} />
					<SelectEnumField field={'enumValue'} label={'Enum with boolean, numbers and null'} options={[
						{ value: 'a', label: 'Option A' },
						{ value: 'b', label: 'Option B' },
						{ value: 'c', label: 'Option C' },
						{ value: true, label: 'True' },
						{ value: false, label: 'False' },
						{ value: 1, label: 'One' },
						{ value: 2, label: 'Two' },
						{ value: null, label: 'No value' },
					]} required={required} />
				</div>
			</EntitySubTree>
		</Binding>
	</>
}


const ToggleRequired = () => {
	const required = !!useEnvironment().getParameterOrElse('required', false)

	return (
		<Link to={it => it ? ({ pageName: it.pageName, parameters: { required: !required ? '1' : '' } }) : it}>
			<AnchorButton>
				Toggle required
			</AnchorButton>
		</Link>
	)
}
