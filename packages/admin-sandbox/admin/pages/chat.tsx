import { useCallback, useState } from 'react'
import { ScrollView } from '../components/ScrollView/ScrollView'
import { SlotSources } from '../components/Slots'
import { MessageItem, MessageItemProps } from '../components/messages/ui/MessageItem'
import { NewMessageInput } from '../components/messages/ui/NewMessageInput'

export default () => {
	const [messages, setMessages] = useState<MessageItemProps[]>([])

	const onSend = useCallback((message: string) => {
		setMessages(messages => [...messages, { message, mine: true, authorName: 'Jane Doe', createdAt: (new Date()).toISOString() }])
	}, [])

	return (
		<>
			<SlotSources.Title>Chat</SlotSources.Title>
			<SlotSources.Sidebar>
				<ScrollView reverse data-scrolled-bottom={false}>
					<MessageItem
						mine={false}
						message="Hello world"
						authorName="John Doe"
						createdAt="yesterday"
					/>
					{messages.map((message, index) => (
						<MessageItem
							key={index}
							{...message}
						/>
					))}
				</ScrollView>
				<NewMessageInput onSend={onSend} />
			</SlotSources.Sidebar>
		</>
	)
}
