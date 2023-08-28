import { Identity2023 } from '@contember/brand'
import { createNonNullableContextFactory, useClassNameFactory, useId, useOnElementClickOutsideCallback, useOnElementMouseEnterDelayedCallback, useReferentiallyStableCallback, useWindowSize } from '@contember/react-utils'
import { dataAttribute } from '@contember/utilities'
import { ChevronLeftIcon, ExternalLinkIcon, XIcon } from 'lucide-react'
import { PropsWithChildren, ReactNode, useEffect, useRef, useState } from 'react'
import { FocusScope } from 'react-aria'
import { Divider } from '../Divider'
import { VisuallyHidden } from '../VisuallyHidden'

const [SmallScreenContext, useSmallScreenContext] = createNonNullableContextFactory<boolean>('SmallScreenContext')

export const DevBar = ({
	breakpoint = 768,
	children,
}: PropsWithChildren<{
	breakpoint?: number;
}>) => {
	const className = useClassNameFactory('devBar')
	const [expanded, setExpanded] = useState(true)
	const isSmallScreen = useWindowSize().width < breakpoint
	const toggleButtonRef = useRef<HTMLButtonElement>(null)

	const handleToggle = useReferentiallyStableCallback(() => {
		setExpanded(expanded => !expanded)
	})

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.code === 'KeyJ' && (event.ctrlKey || event.metaKey)) {
				event.preventDefault()
				event.stopPropagation()

				if (expanded) {
					setExpanded(false)
					toggleButtonRef.current?.blur()
				} else {
					if (toggleButtonRef.current !== document.activeElement) {
						toggleButtonRef.current?.focus()
					} else {
						toggleButtonRef.current?.blur()
					}
				}
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [expanded, handleToggle])

	const devBarContentRef = useRef<HTMLDivElement>(null)

	useOnElementClickOutsideCallback(devBarContentRef, () => {
		if (expanded) {
			setExpanded(false)
			toggleButtonRef.current?.blur()
		}
	})

	const id = `dev-bar-panel${useId()}`

	return (
		<section
			data-transparent
			data-overrides-lucide-icons
			data-expanded={dataAttribute(expanded)}
			data-small-screen={dataAttribute(isSmallScreen)}
			className={className(null)}
			onKeyDown={event => {
				if (event.code === 'Escape') {
					event.preventDefault()
					event.stopPropagation()

					if (expanded) {
						setExpanded(false)
					} else if (document.activeElement && document.activeElement instanceof HTMLElement) {
						document.activeElement.blur()
					}
				}
			}}
		>
			<style>{`svg { pointer-events: none }`}</style>
			<div ref={devBarContentRef} className={className('content')}>
				<FocusScope contain={expanded} restoreFocus>
					<div
						data-expanded={dataAttribute(expanded)}
						id={id}
						role="dialog"
						style={{ display: 'contents' }}
					>
						<a className={className('brand')} href="https://docs.contember.com/" target="_blank" rel="noreferrer">
							{isSmallScreen ? (
								<Identity2023.LogoIcon />
							) : (
								<>
									<Identity2023.LogoType />
									<ExternalLinkIcon />
								</>
							)}
						</a>

						<Divider gap="gutter" />

						<div className={className('panels')}>
							<SmallScreenContext.Provider value={isSmallScreen}>{children}</SmallScreenContext.Provider>
						</div>

						<Divider gap="gutter" />
					</div>

					<button
						ref={toggleButtonRef}
						id="dev-bar-toggle-button"
						aria-label="Toggle Contember Developer Toolbar"
						aria-controls={id}
						aria-expanded={expanded}
						className={className('close')}
						onClick={handleToggle}
						tabIndex={0}
					>
						{expanded ? <XIcon /> : <ChevronLeftIcon />}
					</button>
				</FocusScope>
			</div>
		</section>
	)
}

export const DevPanel = ({ heading, icon, children, preview }: {
	icon: ReactNode;
	heading: ReactNode,
	children: ReactNode,
	preview?: ReactNode
}) => {
	const id = `cui-devBar-panel-${useId()}`
	const className = useClassNameFactory('devBar')
	const isSmallScreen = useSmallScreenContext()

	const [expanded, setExpanded] = useState(false)
	const mouseEnterTimeStampRef = useRef<ReturnType<typeof Date.now> | undefined>(undefined)

	const devPanelRef = useRef<HTMLDivElement>(null)

	useOnElementMouseEnterDelayedCallback(devPanelRef, useReferentiallyStableCallback(({ type }) => {
		if (type === 'mouseenter') {
			mouseEnterTimeStampRef.current = Date.now() + 300
			setExpanded(true)
		}
	}))

	return (
		<div
			ref={devPanelRef}
			data-expanded={dataAttribute(expanded)}
			className={className('trigger')}
			onMouseLeave={useReferentiallyStableCallback(() => {
				setExpanded(false)
			})}
			onKeyDown={useReferentiallyStableCallback(event => {
				if (expanded && event.code === 'Escape') {
					event.preventDefault()
					event.stopPropagation()
					setExpanded(false)
				}
			})}
		>
			<button
				tabIndex={0}
				aria-haspopup="dialog"
				aria-controls={id}
				aria-expanded={expanded}
				className={className('trigger-label')}
				onClick={useReferentiallyStableCallback(() => {
					if (mouseEnterTimeStampRef.current && Date.now() < mouseEnterTimeStampRef.current) {
						return
					} else {
						setExpanded(expanded => !expanded)
						mouseEnterTimeStampRef.current = undefined
					}
				})}
			>
				{icon}
				<VisuallyHidden hidden={isSmallScreen}>{preview ?? heading}</VisuallyHidden>
			</button>
			{expanded && (
				<FocusScope autoFocus contain restoreFocus>
					<div tabIndex={0} id={id} role="dialog" className={className('panel', 'dangerously-remove-native-focus-outline')}>
						<div className={className('panel-content', 'native-focus-outline-handler')}>
							<h2 className="h4">
								{heading}
							</h2>
							<div className={className('panel-body')}>
								{children}
							</div>
						</div>
					</div>
				</FocusScope>
			)}
		</div>
	)
}
