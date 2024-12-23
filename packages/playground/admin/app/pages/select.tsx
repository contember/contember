import { EntitySubTree } from '@contember/interface'
import { Field, useEnvironment } from '@contember/react-binding'
import { ArchiveIcon } from 'lucide-react'
import { Title } from '~/app/components/title'
import { ToggleRequired } from '~/app/components/toggle-required'
import { Binding, PersistButton } from '~/lib/binding'
import { InputField, MultiSelectField, SelectEnumField, SelectField, SortableMultiSelectField } from '~/lib/form'
import { Slots } from '~/lib/layout'
import { Divider } from '~/lib/ui/divider'


export const HasOne = () => {
	const required = !!useEnvironment().getParameterOrElse('required', false)

	return (
		<Binding>
			<Slots.Title>
				<Title icon={<ArchiveIcon />}>Has one select</Title>
			</Slots.Title>

			<Slots.Actions>
				<ToggleRequired />
				<PersistButton />
			</Slots.Actions>

			<EntitySubTree entity="SelectRoot(unique = unique)" setOnCreate="(unique = unique)">
				<div className="space-y-4">
					<SelectField field="hasOne" label="Has one value" initialSorting={{ name: 'asc' }} required={required}>
						<Field field="name" />
					</SelectField>
					<Divider />
					<InputField field="dummy" label="Dummy to trigger dirty state" />
				</div>
			</EntitySubTree>
		</Binding>
	)
}
export const hasMany = () => (
	<Binding>
		<Slots.Title>
			<Title icon={<ArchiveIcon />}>Has many select</Title>
		</Slots.Title>

		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

		<EntitySubTree entity="SelectRoot(unique = unique)" setOnCreate="(unique = unique)">
			<div className="space-y-4">
				<InputField field="dummy" label="Dummy to trigger dirty state" />
				<MultiSelectField field="hasMany" label="Has many values">
					<Field field="name" />
				</MultiSelectField>
			</div>
		</EntitySubTree>
	</Binding>
)
export const HasManySortable = () => (
	<Binding>
		<Slots.Title>
			<Title icon={<ArchiveIcon />}>Has many sortable select</Title>
		</Slots.Title>

		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

		<EntitySubTree entity="SelectRoot(unique = unique)" setOnCreate="(unique = unique)">
			<div className="space-y-4">
				<InputField field="dummy" label="Dummy to trigger dirty state" />
				<SortableMultiSelectField field="hasManySorted" connectAt="value" sortableBy="order" label="Has many sortable values">
					<Field field="name" />
				</SortableMultiSelectField>
			</div>
		</EntitySubTree>
	</Binding>
)

export const CreateNewForm = () => (
	<Binding>
		<Slots.Title>
			<Title icon={<ArchiveIcon />}>Create new form</Title>
		</Slots.Title>

		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

		<EntitySubTree entity="SelectRoot(unique = unique)" setOnCreate="(unique = unique)">
			<div className="space-y-4">
				<SelectField
					field="hasOne"
					label="Has one value"
					createNewForm={<>
						<InputField field="name" label="Name" />
						<InputField field="slug" label="Slug" />
					</>}
				>
					<Field field="name" />
				</SelectField>
			</div>
		</EntitySubTree>
	</Binding>
)

export const EnumSelect = () => {
	const required = !!useEnvironment().getParameterOrElse('required', false)

	return (
		<Binding>
			<Slots.Title>
				<Title icon={<ArchiveIcon />}>Enum select</Title>
			</Slots.Title>

			<Slots.Actions>
				<ToggleRequired />
				<PersistButton />
			</Slots.Actions>

			<EntitySubTree entity="InputRoot(unique = unique)" setOnCreate="(unique = unique)">
				<div className="space-y-4">
					<SelectEnumField field="enumValue" label="Some enum" required={required} />
					<SelectEnumField field="enumValue" label="Enum with boolean, numbers and null" options={[
						{ value: 'a', label: 'Option A' },
						{ value: 'b', label: 'Option B' },
						{ value: 'c', label: 'Option C' },
						{ value: true, label: 'True' },
						{ value: false, label: 'False' },
						{ value: 1, label: 'One' },
						{ value: 2, label: 'Two' },
						{ value: null, label: 'No value' },
					]} required={required} />
					<Divider />
					<InputField field="dummy" label="Dummy to trigger dirty state" />
				</div>
			</EntitySubTree>
		</Binding>
	)
}
