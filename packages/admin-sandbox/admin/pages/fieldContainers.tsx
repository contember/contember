import { Button, ButtonGroup, Divider, FieldContainer, Label, Stack, TextInput } from '@contember/ui'
import { AlignCenterVerticalIcon, AlignEndVerticalIcon, AlignStartVerticalIcon, ColumnsIcon, RowsIcon, StretchHorizontalIcon } from 'lucide-react'
import { useState } from 'react'
import { SlotSources } from '../components/Slots'

const errors = [{ message: 'Lorem ipsum error sit amet' }]

export default () => {
	const [direction, setDirection] = useState<'horizontal' | 'vertical'>('vertical')
	const [align, setAlign] = useState<'start' | 'center' | 'end' | 'stretch'>('stretch')

	return (
		<>
			<SlotSources.Title>FieldContainers</SlotSources.Title>

			<SlotSources.ContentHeader>
				<Stack horizontal gap="gutter">
					<Stack align="center" horizontal>
						<Label>Direction:</Label>
						<ButtonGroup>
							<Button square borderRadius="full" active={direction === 'horizontal'} onClick={() => setDirection('horizontal')}><ColumnsIcon /></Button>
							<Button square borderRadius="full" active={direction === 'vertical'} onClick={() => setDirection('vertical')}><RowsIcon /></Button>
						</ButtonGroup>
					</Stack>

					<Stack align="center" horizontal>
						<Label>Align:</Label>
						<ButtonGroup>
							<Button square borderRadius="full" active={align === 'start'} onClick={() => setAlign('start')}><AlignStartVerticalIcon /></Button>
							<Button square borderRadius="full" active={align === 'center'} onClick={() => setAlign('center')}><AlignCenterVerticalIcon /></Button>
							<Button square borderRadius="full" active={align === 'end'} onClick={() => setAlign('end')}><AlignEndVerticalIcon /></Button>
						</ButtonGroup>
						<Button square borderRadius="full" active={align === 'stretch'} onClick={() => setAlign('stretch')}><StretchHorizontalIcon /></Button>
					</Stack>
				</Stack>
			</SlotSources.ContentHeader>

			<Stack align={align} horizontal={direction === 'horizontal'} gap="large">
				FieldContainer with various label positions:
				<FieldContainer
					label="Lorem ipsum"
					labelDescription="Lorem ipsum dolor"
					description="Lorem ipsum dolor sit amet"
					footer={<Button distinction="primary">Add</Button>}
					errors={errors}
				>
					<TextInput name="name" placeholder="Enter name..." />
				</FieldContainer>

				<Divider />

				<FieldContainer
					label="Lorem ipsum"
					labelPosition="bottom"
					labelDescription="Lorem ipsum dolor"
					description="Lorem ipsum dolor sit amet"
					footer={<Button distinction="primary">Add</Button>}
					errors={errors}
				>
					<TextInput name="name" placeholder="Enter name..." />
				</FieldContainer>

				<Divider />

				<FieldContainer
					display="inline"
					label="Lorem ipsum"
					labelPosition="left"
					description="Lorem ipsum dolor sit amet"
					footer={<Button distinction="primary">Add</Button>}
				>
					<TextInput name="name" placeholder="Enter name..." />
				</FieldContainer>

				<FieldContainer
					display="inline"
					label="Lorem ipsum"
					labelPosition="left"
					labelDescription="Lorem ipsum dolor"
					description="Lorem ipsum dolor sit amet"
					footer={<Button distinction="primary">Add</Button>}
				>
					<TextInput name="name" placeholder="Enter name..." />
				</FieldContainer>

				<FieldContainer
					label="Lorem ipsum"
					labelPosition="left"
					description="Lorem ipsum dolor sit amet"
					footer={<Button distinction="primary">Add</Button>}

				>
					<TextInput name="name" placeholder="Enter name..." />
				</FieldContainer>

				<FieldContainer
					label="Lorem ipsum"
					labelPosition="left"
					labelDescription="Lorem ipsum dolor"
					description="Lorem ipsum dolor sit amet"
					footer={<Button distinction="primary">Add</Button>}
				>
					<TextInput name="name" placeholder="Enter name..." />
				</FieldContainer>

				<Divider />

				<FieldContainer
					display="inline"
					label="Lorem ipsum"
					labelPosition="right"
					description="Lorem ipsum dolor sit amet"
					footer={<Button distinction="primary">Add</Button>}
				>
					<TextInput name="name" placeholder="Enter name..." />
				</FieldContainer>

				<FieldContainer
					display="inline"
					label="Lorem ipsum"
					labelPosition="right"
					labelDescription="Lorem ipsum dolor"
					description="Lorem ipsum dolor sit amet"
					footer={<Button distinction="primary">Add</Button>}
				>
					<TextInput name="name" placeholder="Enter name..." />
				</FieldContainer>

				<FieldContainer
					label="Lorem ipsum"
					labelPosition="right"
					description="Lorem ipsum dolor sit amet"
					footer={<Button distinction="primary">Add</Button>}
				>
					<TextInput name="name" placeholder="Enter name..." />
				</FieldContainer>

				<FieldContainer
					label="Lorem ipsum"
					labelPosition="right"
					labelDescription="Lorem ipsum dolor"
					description="Lorem ipsum dolor sit amet"
					footer={<Button distinction="primary">Add</Button>}
				>
					<TextInput name="name" placeholder="Enter name..." />
				</FieldContainer>
			</Stack>
		</>
	)
}
