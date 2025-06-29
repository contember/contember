import {
	useId,
	useOnElementClickOutsideCallback,
	useReferentiallyStableCallback,
	useWindowSize,
} from '@contember/react-utils'
import { dataAttribute } from '@contember/utilities'
import { type PropsWithChildren, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

const className = (cls: string | null) => cls ? `cui-devBar-${cls}` : 'cui-devBar'

export const DevBar = ({
	breakpoint = 768,
	children,
}: PropsWithChildren<{
	breakpoint?: number
}>) => {
	const [expanded, setExpanded] = useState(false)
	const isSmallScreen = useWindowSize().width < breakpoint

	const handleToggle = useReferentiallyStableCallback(() => {
		setExpanded(expanded => !expanded)
	})

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.code === 'KeyJ' && (event.ctrlKey || event.metaKey)) {
				event.preventDefault()
				event.stopPropagation()

				handleToggle()
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [expanded, handleToggle])

	const devBarContentRef = useRef<HTMLDivElement>(null)

	useOnElementClickOutsideCallback(devBarContentRef, () => {
		if (expanded) {
			setExpanded(false)
		}
	})

	const id = `dev-bar-panel${useId()}`

	return (
		<section
			data-transparent="true"
			data-overrides-lucide-icons="true"
			data-expanded={dataAttribute(expanded)}
			data-small-screen={dataAttribute(isSmallScreen)}
			className={className(null)}
		>
			<div ref={devBarContentRef} className={className('content')}>
				<div
					data-expanded={true}
					id={id}
					role="dialog"
					style={{ display: 'contents' }}
				>
					<div className={className('panels')}>
						{children}
					</div>
				</div>
			</div>
		</section>
	)
}

interface DevPanelProps {
	icon: ReactNode
	heading: ReactNode
	children: ReactNode
	preview?: ReactNode
}

export const DevPanel = ({ heading, icon, children, preview }: DevPanelProps) => {
	const id = `cui-devBar-panel-${useId()}`
	const dialogRef = useRef<HTMLDialogElement>(null)
	const triggerRef = useRef<HTMLButtonElement>(null)

	const handleOpen = useCallback(() => {
		dialogRef.current?.showModal()
	}, [])

	const handleClose = useCallback(() => {
		dialogRef.current?.close()
	}, [])

	useEffect(() => {
		const dialog = dialogRef.current
		if (!dialog) return

		const handleClickOutside = (event: MouseEvent) => {
			const rect = dialog.getBoundingClientRect()
			const isInDialog = (
				rect.top <= event.clientY &&
				event.clientY <= rect.top + rect.height &&
				rect.left <= event.clientX &&
				event.clientX <= rect.left + rect.width
			)

			if (!isInDialog) {
				dialog.close()
			}
		}

		dialog.addEventListener('click', handleClickOutside)
		return () => dialog.removeEventListener('click', handleClickOutside)
	}, [])

	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				handleClose()
			}
		}

		document.addEventListener('keydown', handleEscape)
		return () => document.removeEventListener('keydown', handleEscape)
	}, [handleClose])

	return (
		<div className={className('trigger')}>
			<button
				type="button"
				ref={triggerRef}
				tabIndex={0}
				aria-haspopup="dialog"
				aria-controls={id}
				className={className('trigger-label')}
				onClick={handleOpen}
			>
				{icon}
				<span className={className('trigger-label-text')}>
					{preview ?? heading}
				</span>
			</button>

			<dialog ref={dialogRef} id={id} className={className('panel')}>
				<div className={className('panel-content')}>
					<div className={className('panel-header')}>
						<h2 className="h4">{heading}</h2>
						<button
							type="button"
							onClick={handleClose}
							className={className('close-button')}
							aria-label="Close"
						>
							✕
						</button>
					</div>
					<div className={className('panel-body')}>
						{children}
					</div>
				</div>
			</dialog>
		</div>
	)
}
