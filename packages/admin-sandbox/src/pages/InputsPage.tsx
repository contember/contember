import {
	CheckboxField,
	DateField,
	DateTimeField,
	EditPage,
	FloatField,
	LocationField,
	NumberField,
	RadioField,
	SelectField,
	SlugField,
	TextAreaField,
	TextField,
} from '@contember/admin'


export const InputsPage = (
	<EditPage pageName="inputs" entity="InputShowcase(unique = One)" setOnCreate="(unique = One)">
		<TextField field={'textValue'} label={'Text'} />
		<SlugField derivedFrom={'textValue'} field={'slugValue'} label={'Slug'} />
		<TextAreaField field={'multilineValue'} label={'Multiline text'} />
		<CheckboxField field={'boolValue'} label={'Bool'} />
		<NumberField field={'intValue'} label={'Int'} />
		<FloatField field={'floatValue'} label={'Float value'} />
		<DateField field={'dateValue'} label={'Date'} />
		<DateTimeField field={'dateTimeValue'} label={'Date time'} />
		<LocationField latitudeField={'gpsLatValue'} longitudeField={'gpsLonValue'} label={'Map'} />
		<RadioField field={'enumValue'} label={'Value'} options={[
			{ value: 'a', label: 'A option' },
			{ value: 'b', label: 'B option' },
			{ value: 'c', label: 'C option' },
		]} orientation={'horizontal'} />
		<SelectField field={'selectValue	'} label={'Value'} options={[
			{ value: 'a', label: 'A option' },
			{ value: 'b', label: 'B option' },
			{ value: 'c', label: 'C option' },
		]} />
	</EditPage>
)
