import {
	Block,
	BlockRepeater,
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
	TimeField,
} from '@contember/admin'


export default () => (
	<EditPage entity="InputShowcase(unique = One)" setOnCreate="(unique = One)">
		<TextField field={'textValue'} label={'Text'} />
		<SlugField derivedFrom={'textValue'} field={'slugValue'} label={'Slug with prefix'} unpersistedHardPrefix="https://www.contember.com/" linkToExternalUrl />
		<SlugField derivedFrom={'textValue'} field={'slugValue'} label={'Slug without prefix'} />
		<TextAreaField field={'multilineValue'} label={'Multiline text'} />
		<CheckboxField field={'boolValue'} label={'Bool'} />
		<NumberField field={'intValue'} label={'Int'} />
		<FloatField field={'floatValue'} label={'Float value'} />
		<TimeField field={'timeValue'} label={'Time'} />
		<DateField field={'dateValue'} label={'Date'} />
		<DateTimeField field={'dateTimeValue'} label={'Date time'} />
		<DateTimeField field={'dateTimeValue'} label={'Date time'} min="2020-12-02T01:20" max="2022-01-20T23:13" />
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
		<BlockRepeater
			field="blocks"
			label={undefined}
			discriminationField="type"
			sortableBy="order"
			addButtonText="Add content block"
		>
			<Block
				discriminateBy="heroSection"
				label="Hero section"
			>
				<TextField field="primaryText" label="Headline" />
			</Block>
		</BlockRepeater>
	</EditPage>
)
