import { Button, Message } from '@contember/ui'
import { CheckCircle2Icon } from 'lucide-react'
import { SlotSources } from '../components/Slots'

export default () => (
	<>
		<SlotSources.Title>Message</SlotSources.Title>

		Intent variants:
		<Message>Default intent: positive</Message>
		<Message intent="default">Intent: default</Message>
		<Message intent="positive">Intent: positive</Message>
		<Message intent="success">Intent: negative</Message>
		<Message intent="warn">Intent: warn</Message>
		<Message intent="danger">Intent: danger</Message>
		<Message intent="primary">Intent: primary</Message>
		<Message intent="secondary">Intent: secondary</Message>

		Elevated message with action and icon:
		<Message
			elevated
			action={<Button borderRadius="padding">Click me</Button>}
			icon={<CheckCircle2Icon />}
			intent="success"
			borderRadius="large"
		>
			Default
		</Message>

		Important variant with semi-opaque background:
		<Message important>Important</Message>

		Border radius variants:
		<Message important intent="success" borderRadius={false}>No border radius</Message>
		<Message important intent="success">Default</Message>
		<Message important intent="success" borderRadius>Border radius</Message>
		<Message important intent="success" borderRadius="gap">Border radius: gap</Message>
		<Message important intent="success" borderRadius="gutter">Border radius: gutter</Message>
		<Message important intent="success" borderRadius="padding">Border radius: padding</Message>
		<Message important intent="success" borderRadius="large">Border radius: large</Message>
		<Message important intent="success" borderRadius="larger">Border radius: larger</Message>

		Size variants:
		<Message important size="small">Small</Message>
		<Message important>Default</Message>
		<Message important size="large">Large</Message>

		Padding variants:
		<Message important padding>Padding</Message>
		<Message important padding={false}>No padding</Message>
		<Message important padding="gap">Padding: gap</Message>
		<Message important padding="gutter">Padding: gutter</Message>
		<Message important padding="padding">Padding: padding</Message>
		<Message important padding="large">Padding: large</Message>
		<Message important padding="larger">Padding: larger</Message>
	</>
)
