import {
	Block,
	BlockRepeater,
	CheckboxField,
	DateField,
	DateTimeField,
	DisplayTextField,
	EditScope,
	EmailField,
	FloatField,
	LocationField,
	NumberField,
	PersistButton,
	RadioField,
	SearchField,
	SelectField,
	SimpleRelativeSingleField,
	SlugField,
	TextareaField,
	TextareaFieldProps,
	TextareaInput,
	TextField,
	TimeField,
	UrlField,
	UseControlProps,
	useFieldControl,
} from '@contember/admin'
import { Title } from '../components/Directives'
import { Slots } from '../components/Slots'

export const JsonField = SimpleRelativeSingleField<TextareaFieldProps, string>(
	(fieldMetadata, {
		style,
		...props
	}) => {
		const inputProps = useFieldControl<string, string>({
			...props,
			fieldMetadata,
			parse: val => val ? JSON.parse(val) : null,
			format: val => val ? JSON.stringify(val) : null,
		})

		return <TextareaInput {...inputProps} style={style} />
	},
	'JsonField',
)

const SHOW_OVERRIDES = false

const extraDebugProps = SHOW_OVERRIDES ? {
	containerStyle: { outline: '1px solid red' },
	containerClassName: 'background-container',
	style: { outline: '1px solid blue' },
	className: 'background-input',
	onFocus: () => console.log('focus'),
	onBlur: () => console.log('blur'),
	onFocusChange: (state: boolean) => console.log(`focus change: ${state}`),
} : {}

export default () => (
	<EditScope entity="InputShowcase(unique = One)" setOnCreate="(unique = One)">
		<Title>Inputs Showcase</Title>
		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>
		<style>{`
		.background-container { background-color: pink !important; }
		.background-input { background-color: lightblue !important; }
		`}</style>
		<Slots.ContentStack>
			<TextField {...extraDebugProps} required labelPosition="labelLeft" field={'textValue'} label={'Text'} placeholder="Enter text..." />
			<DisplayTextField {...extraDebugProps} labelPosition="labelLeft" field={'textValue'} label={'Text'} placeholder="N/A" direction="horizontal-reverse" />
			<TextField {...extraDebugProps} field={'notNullTextValue'} label={'Not null text'} />
			<EmailField {...extraDebugProps} field={'emailValue'} label={'Your email'} />
			<SearchField {...extraDebugProps} field={'searchValue'} label={'Search page'} />
			<UrlField {...extraDebugProps} field={'urlValue'} label={'URL'} />
			<SlugField {...extraDebugProps} required derivedFrom={'textValue'} field={'slugValue'} label={'Slug with prefix'} unpersistedHardPrefix="https://www.contember.com/" linkToExternalUrl />
			<SlugField {...extraDebugProps} derivedFrom={'textValue'} field={'slugValue'} label={'Slug without prefix'} />
			<TextareaField {...extraDebugProps} field={'multilineValue'} label={'Multiline text'} />
			<CheckboxField {...extraDebugProps} field={'boolValue'} label={'Bool'} />
			<CheckboxField {...extraDebugProps} field={'boolValue'} label={'Bool'} description="Same checkbox with description" labelDescription="This could be true or false or null" />
			<NumberField {...extraDebugProps} field={'intValue'} label={'Int'} step={2} />
			<FloatField {...extraDebugProps} field={'floatValue'} label={'Float value'} />
			<TimeField {...extraDebugProps} field={'timeValue'} label={'Time'} />
			<TimeField {...extraDebugProps} field={'timeValue'} label={'Time'} seconds />
			<DateField {...extraDebugProps} field={'dateValue'} label={'Date'} />
			<DateTimeField {...extraDebugProps} field={'dateTimeValue'} label={'Date time'} />
			<DateTimeField {...extraDebugProps} field={'dateTimeValue'} label={'Date time'} min="2020-12-02T01:20" max="2022-01-20T23:13" />
			<LocationField {...extraDebugProps} latitudeField={'gpsLatValue'} longitudeField={'gpsLonValue'} label={'Map'} />
			<RadioField {...extraDebugProps} field={'enumValue'} label={'Value'} options={[
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
					<TextField {...extraDebugProps} field="primaryText" label="Headline" />
				</Block>
			</BlockRepeater>
			<SelectField {...extraDebugProps} field={'selectValue'} label={'Value'} options={[
				{ value: 'a', label: 'A option' },
				{ value: 'b', label: 'B option' },
				{ value: 'c', label: 'C option' },
			]} />
			<JsonField {...extraDebugProps} field={'jsonValue'} label={'JSON'} />
		</Slots.ContentStack>
	</EditScope>
)
