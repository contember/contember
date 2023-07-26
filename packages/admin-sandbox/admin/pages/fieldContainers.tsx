import { FieldContainer, TextInput } from '@contember/ui'
import { SlotSources } from '../components/Slots'

export default () => (
	<>
		<SlotSources.Title>FieldContainers</SlotSources.Title>

		FieldContainer with various label positions:
		<FieldContainer
			label="Lorem ipsum"
			labelDescription="Lorem ipsum dolor"
			description="Lorem ipsum dolor sit amet"
		>
			<TextInput name="name" placeholder="Enter name..." />
		</FieldContainer>

		<FieldContainer
			labelPosition="labelInlineLeft"
			label="Lorem ipsum"
			labelDescription="Lorem ipsum dolor"
			description="Lorem ipsum dolor sit amet"
		>
			<TextInput name="name" placeholder="Enter name..." />
		</FieldContainer>

		<FieldContainer
			labelPosition="labelInlineRight"
			label="Lorem ipsum"
			labelDescription="Lorem ipsum dolor"
			description="Lorem ipsum dolor sit amet"
		>
			<TextInput name="name" placeholder="Enter name..." />
		</FieldContainer>

		<FieldContainer
			labelPosition="labelLeft"
			label="Lorem ipsum"
			labelDescription="Lorem ipsum dolor"
			description="Lorem ipsum dolor sit amet"
		>
			<TextInput name="name" placeholder="Enter name..." />
		</FieldContainer>

		<FieldContainer
			labelPosition="labelRight"
			label="Lorem ipsum"
			labelDescription="Lorem ipsum dolor"
			description="Lorem ipsum dolor sit amet"
		>
			<TextInput name="name" placeholder="Enter name..." />
		</FieldContainer>

	</>
)
