import { EntitySubTree, useField } from '@contember/interface'
import { Component, Field, useEntityBeforePersist, useEnvironment } from '@contember/react-binding'
import slugify from '@sindresorhus/slugify'
import { FormInputIcon } from 'lucide-react'
import { Title } from '~/app/components/title'
import { ToggleRequired } from '~/app/components/toggle-required'
import { CheckboxListEnumField } from '~/lib-extra/checkboxlist-enum-field'
import { FractionalAmountField } from '~/lib-extra/fractional-amount-field'
import { FieldExists } from '~/lib-extra/has-field'
import { SelectOrTypeField } from '~/lib-extra/select-or-type-field'
import { SlugField } from '~/lib-extra/slug-field/field'
import { Binding, PersistButton } from '~/lib/binding'
import { CheckboxField, InputField, InputFieldProps, RadioEnumField, TextareaField } from '~/lib/form'
import { Slots } from '~/lib/layout'
import { DefaultRepeater } from '~/lib/repeater'
import { Button } from '~/lib/ui/button'
import { Divider } from '~/lib/ui/divider'
import { uic } from '~/lib/utils'

export const Basic = () => {
	const required = !!useEnvironment().getParameterOrElse('required', false)

	return (
		<Binding>
			<Slots.Title>
				<Title icon={<FormInputIcon />}>Basic inputs</Title>
			</Slots.Title>

			<Slots.Actions>
				<ToggleRequired />
				<PersistButton />
			</Slots.Actions>

			<EntitySubTree entity="InputRoot(unique = unique)" setOnCreate="(unique = unique)">
				<div className="space-y-4">
					<InputField field="textValue" label="Text" description="Hello world" required={required} />
					<InputField field="intValue" label="Number" required={required} />
					<InputField field="floatValue" label="Float" required={required} />
					<InputField field="dateValue" label="Date" required={required} />
					<InputField field="timeValue" label="Time" required={required} />
					<InputField field="datetimeValue" label="Date time" required={required} />

					<FieldExists field="nonExistingField">
						<InputField field="nonExistingField" label="Date time" />
					</FieldExists>
					<Divider />
					<InputField field="dummy" label="Dummy to trigger dirty state" />
				</div>
			</EntitySubTree>
		</Binding>
	)
}
export const Cents = () => {
	const required = !!useEnvironment().getParameterOrElse('required', false)

	return (
		<Binding>
			<Slots.Title>
				<Title icon={<FormInputIcon />}>Cents field</Title>
			</Slots.Title>

			<Slots.Actions>
				<ToggleRequired />
				<PersistButton />
			</Slots.Actions>

			<EntitySubTree entity="InputRoot(unique = unique)" setOnCreate="(unique = unique)">
				<div className="space-y-4">
					<InputField field="dummy" label="Dummy to trigger dirty state" />
					<FractionalAmountField field="intValue" label="Cents" required={required} fractionDigits={2} />
					<Divider />
					<InputField field="dummy" label="Dummy to trigger dirty state" />
				</div>
			</EntitySubTree>
		</Binding>
	)
}


export const SelectOrType = () => (
	<Binding>
		<Slots.Title>
			<Title icon={<FormInputIcon />}>Select or type</Title>
		</Slots.Title>

		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

		<EntitySubTree entity="InputRoot(unique = unique)" setOnCreate="(unique = unique)">
			<div className="space-y-4">
				<SelectOrTypeField field="textValue" label="Text" options={{
					a: 'Option A',
					b: 'Option B',
				}} />
				<Divider />
				<InputField field="dummy" label="Dummy to trigger dirty state" />
			</div>
		</EntitySubTree>
	</Binding>
)

export const Textarea = () => {
	const required = !!useEnvironment().getParameterOrElse('required', false)

	return (
		<Binding>
			<Slots.Title>
				<Title icon={<FormInputIcon />}>Textarea</Title>
			</Slots.Title>

			<Slots.Actions>
				<ToggleRequired />
				<PersistButton />
			</Slots.Actions>

			<EntitySubTree entity="InputRoot(unique = unique)" setOnCreate="(unique = unique)">
				<div className="space-y-4">
					<TextareaField field="textValue" label="Text" description="Hello world" required={required} />
					<Divider />
					<InputField field="dummy" label="Dummy to trigger dirty state" />
				</div>
			</EntitySubTree>
		</Binding>
	)
}

export const Checkbox = () => {
	const required = !!useEnvironment().getParameterOrElse('required', false)

	return (
		<Binding>
			<Slots.Title>
				<Title icon={<FormInputIcon />}>Checkbox</Title>
			</Slots.Title>

			<Slots.Actions>
				<ToggleRequired />
				<PersistButton />
			</Slots.Actions>

			<EntitySubTree entity="InputRoot(unique = unique)" setOnCreate="(unique = unique)">
				<div className="space-y-4">
					<CheckboxField field="boolValue" label="Some boolean" description="Hello world" required={required} />
					<Divider />
					<InputField field="dummy" label="Dummy to trigger dirty state" />
				</div>
			</EntitySubTree>
		</Binding>
	)
}

export const EnumRadio = () => {
	const required = !!useEnvironment().getParameterOrElse('required', false)

	return (
		<Binding>
			<Slots.Title>
				<Title icon={<FormInputIcon />}>Radio</Title>
			</Slots.Title>

			<Slots.Actions>
				<ToggleRequired />
				<PersistButton />
			</Slots.Actions>

			<EntitySubTree entity="InputRoot(unique = unique)" setOnCreate="(unique = unique)">
				<div className="space-y-4">
					<RadioEnumField field="enumValue" label="Some enum" required={required} />
					<RadioEnumField field="enumValue" label="Enum with boolean, numbers and null" options={[
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


export const CheckboxList = () => {
	return (
		<Binding>
			<Slots.Title>
				<Title icon={<FormInputIcon />}>Checkbox list</Title>
			</Slots.Title>

			<Slots.Actions>
				<PersistButton />
			</Slots.Actions>

			<EntitySubTree entity="InputRoot(unique = unique)" setOnCreate="(unique = unique)">
				<div className="space-y-4">
					<CheckboxListEnumField field="enumArrayValue" label="Some enum" />
					<Divider />
					<InputField field="dummy" label="Dummy to trigger dirty state" />
				</div>
			</EntitySubTree>
		</Binding>
	)
}

const FillValue = () => {
	const textField = useField('textValue')
	const intField = useField('intValue')
	const checkbox = useField('boolValue')

	return (
		<>
			<Button variant="secondary" onClick={() => {
				textField.updateValue('Co')
				intField.updateValue(101)
			}}>
				Fill invalid
			</Button>
			<Button variant="secondary" onClick={() => {
				textField.updateValue('Contember')
				intField.updateValue(99)
			}}>
				Fill valid
			</Button>
			<Button variant="secondary" onClick={() => checkbox.updateValue(null)}>Set checkbox null</Button>
			<Button variant="secondary" onClick={() => checkbox.updateValue(true)}>Set checkbox true</Button>
			<Button variant="secondary" onClick={() => checkbox.updateValue(false)}>Set checkbox false</Button>
		</>
	)
}

export const ClientValidation = () => (
	<Binding>
		<Slots.Title>
			<Title icon={<FormInputIcon />}>Client validation</Title>
		</Slots.Title>

		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

		<EntitySubTree entity="InputRoot(unique = unique)" setOnCreate="(unique = unique)">
			<div className="space-y-4">
				<div className="space-x-4">
					<FillValue />
				</div>

				<InputField field="textValue" label="Name" description="3-16 characters" required inputProps={{ pattern: '\\w{3,16}' }} />
				<InputField field="intValue" label="Number" description="max 100" inputProps={{
					required: true,
					max: 100,
				}} />
				<CheckboxField field="boolValue" label="Required" description="Required" inputProps={{ required: true }} />
				<Divider />
				<InputField field="dummy" label="Dummy to trigger dirty state" />
			</div>
		</EntitySubTree>
	</Binding>
)

const Code = uic('code', { baseClass: 'bg-gray-100 p-1 rounded' })
const SlugDescription = () => (
	<div className="flex flex-col gap-2">
		<div>This slug field has three types of prefixes:</div>
		<ul className="list-disc pl-6 space-y-1">
			<li>
				Display-only prefix: <Code>http://google.com</Code>
				<span className="text-gray-600 text-sm"> (shown but not saved)</span>
			</li>
			<li>
				Fixed prefix: <Code>/article/</Code>
				<span className="text-gray-600 text-sm"> (saved, cannot be modified)</span>
			</li>
			<li>
				Optional prefix: <Code>foo/</Code>
				<span className="text-gray-600 text-sm"> (saved, can be removed)</span>
			</li>
		</ul>
	</div>
)

export const Slug = () => (
	<Binding>
		<Slots.Title>
			<Title icon={<FormInputIcon />}>Slug</Title>
		</Slots.Title>

		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

		<EntitySubTree entity="Slug(unique = unique)" setOnCreate="(unique = unique)">
			<div className="space-y-4">
				<InputField field="title" label="Title" />
				<SlugField
					description={<SlugDescription />}
					slugify={slugify}
					field="slug"
					label="Slug"
					derivedFrom="title"
					unpersistedHardPrefix="http://google.com"
					persistedHardPrefix="/article/"
					persistedSoftPrefix="foo/"
				/>
			</div>
		</EntitySubTree>
	</Binding>
)


export const ServerRules = () => (
	<Binding>
		<Slots.Title>
			<Title icon={<FormInputIcon />}>Server rules</Title>
		</Slots.Title>

		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

		<DefaultRepeater entities="InputRules" orderBy="id">
			<div className="space-y-4">
				<InputField field="notNullValue" label="Not null" />
				<InputField field="uniqueValue" label="Unique value" />
				<InputField field="validationValue" label="Validation value" />
			</div>
		</DefaultRepeater>
	</Binding>
)

export const CustomError = () => <>
	<Binding>
		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>
		<EntitySubTree entity={'InputRoot(unique=unique)'} setOnCreate={'(unique=unique)'}>
			<div className={'space-y-4'}>
				<InputFieldWithCustomError field={'textValue'} label={'Text'} description={'Hello world'} />
			</div>
		</EntitySubTree>
	</Binding>
</>

const InputFieldWithCustomError = Component<InputFieldProps>(
	() => {
		useEntityBeforePersist(entityAccessor => {
			const field = entityAccessor().getField('textValue')

			if (field.value != 'Hello world') {
				field.addError('You must enter "Hello world"')
			}
		})

		return <InputField field={'textValue'} label={'Text'} description={'Try to write anything but "Hello world"'} />
	},
	() => <Field field={'textValue'} />,
)
