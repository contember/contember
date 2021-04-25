import { Button, ButtonProps, isSpecialLinkClick, toStateClass, toViewClass } from '@contember/ui'
import cn from 'classnames'
import { memo, ReactNode, Ref, useCallback, useMemo, useRef, useState } from 'react'

export interface ConcealableFieldRendererProps {
	onFocus: () => void
	onBlur: () => void
	inputRef: Ref<HTMLInputElement | undefined>
}

export type ConcealableFieldProps = {
	buttonProps?: ButtonProps
	concealTimeout?: number
	renderConcealedValue: () => ReactNode
	children: (rendererProps: ConcealableFieldRendererProps) => ReactNode
	isExtended?: boolean
	editButtonLabel?: ReactNode
}

export const ConcealableField = memo(
	({ buttonProps, concealTimeout = 2000, renderConcealedValue, isExtended, children }: ConcealableFieldProps) => {
		const [isEditing, setIsEditing] = useState(false)
		const [concealTimeoutId, setConcealTimeoutId] = useState<number | undefined>(undefined)
		const inputRef = useRef<HTMLInputElement>()
		const onFocus = useCallback(() => {
			if (concealTimeoutId !== undefined) {
				clearTimeout(concealTimeoutId)
			}
		}, [concealTimeoutId])
		const onBlur = useCallback(() => {
			setConcealTimeoutId((setTimeout(() => setIsEditing(false), concealTimeout) as any) as number)
		}, [concealTimeout])
		const concealedValue = renderConcealedValue()
		const urlValue = useMemo(() => {
			if (
				typeof concealedValue === 'string' &&
				(concealedValue.startsWith('http://') || concealedValue.startsWith('https://'))
			) {
				return concealedValue
			}
			return null
		}, [concealedValue])

		return (
			<div className={cn('concealableField', toViewClass('extended', isExtended), toStateClass('editing', isEditing))}>
				<div className={cn('concealableField-field')}>
					{children({
						onBlur,
						onFocus,
						inputRef,
					})}
				</div>
				<a
					href={urlValue || '#'}
					className="concealableField-cover"
					onClick={event => {
						if (urlValue && isSpecialLinkClick(event.nativeEvent)) {
							return
						}
						event.preventDefault()
						setIsEditing(true)
					}}
					key="concealableField-cover"
					onTransitionEnd={e => {
						if (isEditing && inputRef.current && e.currentTarget === e.target) {
							inputRef.current.focus()
						}
					}}
				>
					<div className="concealableField-value">{concealedValue}</div>
					<Button
						size="small"
						distinction="seamless"
						children="Edit"
						{...buttonProps}
						className="concealableField-button"
					/>
				</a>
			</div>
		)
	},
)
ConcealableField.displayName = 'ConcealableField'
