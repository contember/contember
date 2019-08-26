import { Button, ButtonProps } from '@contember/ui'
import * as React from 'react'

export interface ConcealableFieldRendererProps {
	onFocus: () => void
	onBlur: () => void
	inputRef: React.Ref<HTMLInputElement | undefined>
}

export type ConcealableFieldProps = {
	buttonProps?: ButtonProps
	concealTimeout?: number
	renderConcealedValue: () => React.ReactNode
	children: (rendererProps: ConcealableFieldRendererProps) => React.ReactNode
}

export const ConcealableField = React.memo(
	({ buttonProps, concealTimeout = 2000, renderConcealedValue, children }: ConcealableFieldProps) => {
		const [isEditing, setIsEditing] = React.useState(false)
		const [concealTimeoutId, setConcealTimeoutId] = React.useState<number | undefined>(undefined)
		const inputRef = React.useRef<HTMLInputElement>()
		const onFocus = React.useCallback(() => {
			if (concealTimeoutId !== undefined) {
				clearTimeout(concealTimeoutId)
			}
		}, [concealTimeoutId])
		const onBlur = React.useCallback(() => {
			setConcealTimeoutId(setTimeout(() => setIsEditing(false), concealTimeout))
		}, [concealTimeout])

		React.useLayoutEffect(() => {
			if (isEditing && inputRef.current) {
				inputRef.current.focus()
			}
		}, [isEditing])

		return (
			<div className="concealableField">
				{!isEditing && (
					<div
						className="concealableField-in"
						onClick={() => {
							setIsEditing(true)
						}}
						key="concealableField-in"
					>
						<div className="concealableField-value">{renderConcealedValue()}</div>
						<Button size="small" distinction="seamless" {...buttonProps} className="concealableField-button">
							Edit
						</Button>
					</div>
				)}
				{isEditing &&
					children({
						onBlur,
						onFocus,
						inputRef,
					})}
			</div>
		)
	},
)
ConcealableField.displayName = 'ConcealableField'
