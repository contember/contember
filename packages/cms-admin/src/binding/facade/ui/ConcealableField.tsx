import { Button, ButtonProps, toStateClass, toViewClass } from '@contember/ui'
import * as React from 'react'
import cn from 'classnames'

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
	isExtended?: boolean
}

export const ConcealableField = React.memo(
	({ buttonProps, concealTimeout = 2000, renderConcealedValue, isExtended, children }: ConcealableFieldProps) => {
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
			<div className={cn('concealableField', toViewClass('extended', isExtended), toStateClass('editing', isEditing))}>
				<div className={cn('concealableField-field')}>
					{children({
						onBlur,
						onFocus,
						inputRef,
					})}
				</div>
				<div
					className="concealableField-cover"
					onClick={() => {
						setIsEditing(true)
					}}
					key="concealableField-cover"
				>
					<div className="concealableField-value">{renderConcealedValue()}</div>
					<Button
						size="small"
						distinction="seamless"
						children="Edit"
						{...buttonProps}
						className="concealableField-button"
					/>
				</div>
			</div>
		)
	},
)
ConcealableField.displayName = 'ConcealableField'
