import { Slots } from '@app/lib/layout'
import { EntitySubTree, useField } from '@contember/interface'
import { CheckboxField, InputField, RadioEnumField, TextareaField } from '@app/lib/form'
import * as React from 'react'
import { AnchorButton, Button } from '@app/lib/ui/button'
import { Binding, PersistButton } from '@app/lib/binding'
import { SelectOrTypeField } from '@app/lib-extra/select-or-type-field'
import { FieldExists } from '@app/lib-extra/has-field'
import { SlugField } from '@app/lib-extra/slug-field/field'
import slugify from '@sindresorhus/slugify'
import { TreeRootIdProvider, useEnvironment } from '@contember/react-binding'
import { Link } from '@contember/react-routing'
import { FractionalAmountField } from '@app/lib-extra/fractional-amount-field'
import { DefaultRepeater } from '@app/lib/repeater'

export const Basic = () => {
	const required = !!useEnvironment().getParameterOrElse('required', false)
	return <>
		<Binding>
			<Slots.Actions>
				<PersistButton />
			</Slots.Actions>
			<EntitySubTree entity={'InputRoot(unique=unique)'} setOnCreate={'(unique=unique)'}>
				<div className={'space-y-4'}>
					<ToggleRequired/>
					<InputField field="dummy" label="Dummy to trigger dirty state" />
					<InputField field={'textValue'} label={'Text'} description={'Hello world'} required={required} />
					<InputField field={'intValue'} label={'Number'} required={required} />
					<InputField field={'floatValue'} label={'Float'} required={required} />
					<InputField field={'dateValue'} label={'Date'} required={required} />
					<InputField field={'datetimeValue'} label={'Date time'} required={required} />

					<FieldExists field={'nonExistingField'}>
						<InputField field={'nonExistingField'} label={'Date time'} />
					</FieldExists>
				</div>
			</EntitySubTree>
		</Binding>
	</>
}
export const Cents = () => {
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
					<FractionalAmountField field={'intValue'} label={'Cents'} required={required} fractionDigits={2} />
				</div>
			</EntitySubTree>
		</Binding>
	</>
}


export const SelectOrType = () => {
	return <>
		<Binding>
			<Slots.Actions>
				<PersistButton />
			</Slots.Actions>
			<EntitySubTree entity={'InputRoot(unique=unique)'} setOnCreate={'(unique=unique)'}>
				<div className={'space-y-4'}>
					<InputField field="dummy" label="Dummy to trigger dirty state" />
					<SelectOrTypeField field={'textValue'} label={'Text'} options={{
						a: 'Option A',
						b: 'Option B',
					}} />
				</div>
			</EntitySubTree>
		</Binding>
	</>
}

export const Textarea = () => {
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
					<TextareaField field={'textValue'} label={'Text'} description={'Hello world'} required={required} />
				</div>
			</EntitySubTree>
		</Binding>
	</>
}

export const Checkbox = () => {
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
					<CheckboxField field={'boolValue'} label={'Some boolean'} description={'Hello world'} required={required} />
				</div>
			</EntitySubTree>
		</Binding>
	</>
}

export const EnumRadio = () => {
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
					<RadioEnumField field={'enumValue'} label={'Some enum'} required={required} />
					<RadioEnumField field={'enumValue'} label={'Enum with boolean, numbers and null'} options={[
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


const FillValue = () => {
	const field = useField('textValue')
	const checkbox = useField('boolValue')
	return <>
		<Button onClick={() => field.updateValue('123')}>Fill invalid</Button>
		<Button onClick={() => field.updateValue('abc')}>Fill valid</Button>
		<Button onClick={() => checkbox.updateValue(null)}>Set checkbox null</Button>
		<Button onClick={() => checkbox.updateValue(true)}>Set checkbox true</Button>
		<Button onClick={() => checkbox.updateValue(false)}>Set checkbox false</Button>
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

export const clientValidation = () => <>
	<Binding>
		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>
		<EntitySubTree entity={'InputRoot(unique=unique)'} setOnCreate={'(unique=unique)'}>
			<div className={'space-y-4'}>
				<InputField field="dummy" label="Dummy to trigger dirty state" />
				<div className={'pl-52 space-x-4'}>
					<FillValue />
				</div>
				<InputField field={'textValue'} label={'Name'} required inputProps={{ pattern: '[a-z]+' }} />
				<InputField field={'intValue'} label={'Number'} inputProps={{ required: true, max: 100 }} />
				<CheckboxField field={'boolValue'} label={'Some boolean'} description={'Hello world'} inputProps={{ required: true }} />
				<InputField field={'uuidValue'} label={'UUID'} />
			</div>
		</EntitySubTree>
	</Binding>
</>


export const slug = () => <>
	<Binding>
		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>
		<EntitySubTree entity={'Slug(unique=unique)'} setOnCreate={'(unique=unique)'}>
			<div className={'space-y-4'}>
				<InputField field={'title'} label={'Title'} />
				<SlugField
					slugify={slugify}
					field={'slug'}
					label={'Slug'}
					derivedFrom="title"
					unpersistedHardPrefix="http://google.com"
					persistedHardPrefix="/article/"
					persistedSoftPrefix="foo/"
				/>
			</div>
		</EntitySubTree>
	</Binding>
</>


export const serverRules = () => <>
	<Binding>
		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>
		<DefaultRepeater entities={'InputRules'} orderBy="id">
			<div className={'space-y-4'}>
				<InputField field={'notNullValue'} label={'Not null'} />
				<InputField field={'uniqueValue'} label={'Unique value'} />
				<InputField field={'validationValue'} label={'Validation value'} />
			</div>
		</DefaultRepeater>
	</Binding>
</>

