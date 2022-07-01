import {
	Block,
	BlockRepeater,
	CheckboxField,
	DateField,
	DateTimeField,
	EditPage,
	EmailField,
	FloatField,
	LocationField,
	NumberField,
	RadioField,
	SearchField,
	SelectField,
	SimpleRelativeSingleField,
	SlugField,
	TextareaField,
	TextareaInput,
	TextField,
	TextFieldProps,
	TimeField,
	UrlField,
	useFieldControl,
} from '@contember/admin'

export const JsonField = SimpleRelativeSingleField<TextFieldProps, string>(
	(fieldMetadata, {
		allowNewlines,
		label,
		wrapLines,
		...props
	}) => {
		const inputProps = useFieldControl<string, string>({
			...props,
			fieldMetadata,
			parse: val => val ? JSON.parse(val) : null,
			format: val => val ? JSON.stringify(val) : null,
		})

		return <TextareaInput {...inputProps} />
	},
	'JsonField',
)


export default () => (
	<EditPage entity="InputShowcase(unique = One)" setOnCreate="(unique = One)">
		<TextField field={'textValue'} label={'Text'} />
		<TextField field={'notNullTextValue'} label={'Not null text'} />
		<EmailField field={'emailValue'} label={'Your email'} />
		<SearchField field={'searchValue'} label={'Search page'} />
		<UrlField field={'urlValue'} label={'URL'} />
		<SlugField derivedFrom={'textValue'} field={'slugValue'} label={'Slug with prefix'} unpersistedHardPrefix="https://www.contember.com/" linkToExternalUrl />
		<SlugField derivedFrom={'textValue'} field={'slugValue'} label={'Slug without prefix'} />
		<TextareaField field={'multilineValue'} label={'Multiline text'} />
		<CheckboxField field={'boolValue'} label={'Bool'} />
		<CheckboxField field={'boolValue'} label={'Bool'} description="Same checkbox with description" labelDescription="This could be true or false or null" />
		<NumberField field={'intValue'} label={'Int'} />
		<FloatField field={'floatValue'} label={'Float value'} />
		<TimeField field={'timeValue'} label={'Time'} />
		<TimeField field={'timeValue'} label={'Time'} seconds />
		<DateField field={'dateValue'} label={'Date'} />
		<DateTimeField field={'dateTimeValue'} label={'Date time'} />
		<DateTimeField field={'dateTimeValue'} label={'Date time'} min="2020-12-02T01:20" max="2022-01-20T23:13" />
		<LocationField latitudeField={'gpsLatValue'} longitudeField={'gpsLonValue'} label={'Map'} />
		<RadioField field={'enumValue'} label={'Value'} options={[
			{ value: 'a', label: 'A option' },
			{ value: 'b', label: 'B option' },
			{ value: 'c', label: 'C option' },
		]} orientation={'horizontal'} />
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
		<SelectField field={'selectValue'} label={'Value'} options={[
			{ value: 'a', label: 'A option' },
			{ value: 'b', label: 'B option' },
			{ value: 'c', label: 'C option' },
		]} />
		<JsonField field={'jsonValue'} label={'JSON'} />
	</EditPage>
)
