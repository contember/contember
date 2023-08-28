import { useClassName, useReferentiallyStableCallback } from '@contember/react-utils'
import { Box, Button, TextareaInput } from '@contember/ui'
import { ComponentClassNameProps } from '@contember/utilities'
import { SendHorizontalIcon } from 'lucide-react'
import { forwardRef, memo, useState } from 'react'
import { NewMessageInputProps } from '../types'

export const NewMessageInput = memo(forwardRef<HTMLTextAreaElement, NewMessageInputProps & ComponentClassNameProps>(({
	className: classNameProp,
	componentClassName = 'send-message-input',
	placeholder = 'Send a message...',
	onSend,
	...props
}, forwardedRef) => {
	const [message, setMessage] = useState<string | null>(null)
	const trimmedMessage = message?.trim()

	return (
		<form
			onSubmit={useReferentiallyStableCallback(event => {
				if (trimmedMessage) {
					event.preventDefault()
					onSend(trimmedMessage)
					setMessage(null)
				}
			})}
			onKeyDown={useReferentiallyStableCallback(event => {
				if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
					if (trimmedMessage) {
						event.preventDefault()
						onSend(trimmedMessage)
						setMessage(null)
					}
				}
			})}
			className={useClassName(componentClassName, classNameProp)}
			{...props}
		>
			<Box horizontal focusRing padding={false} align="end">
				<TextareaInput
					ref={forwardedRef}
					distinction="seamless-with-padding"
					focusRing={false}
					minRows={1}
					maxRows={5}
					onChange={value => setMessage(value)}
					placeholder={placeholder}
					value={message}
				/>
				<Button distinction="toned" type="submit" disabled={!trimmedMessage}>
					Send
					<SendHorizontalIcon />
				</Button>
			</Box>
		</form>
	)
}))
