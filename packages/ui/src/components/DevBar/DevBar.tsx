import { Identity2023 } from '@contember/brand'
import { createNonNullableContextFactory, useReferentiallyStableCallback, useWindowSize } from '@contember/react-utils'
import { dataAttribute, useClassNameFactory } from '@contember/utilities'
import { ChevronLeftIcon, ExternalLinkIcon, XIcon } from 'lucide-react'
import { PropsWithChildren, ReactNode, useEffect, useId, useRef, useState } from 'react'
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
	const className = useClassNameFactory(['devBar', 'root'])
	const [expanded, setExpanded] = useState(true)
	const isSmallScreen = useWindowSize().width < breakpoint

	const handleToggle = useReferentiallyStableCallback(() => {
		setExpanded(expanded => !expanded)
	})

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			const toggleButton = document.getElementById('dev-bar-toggle-button')

			if (event.code === 'KeyJ' && (event.ctrlKey || event.metaKey)) {
				event.stopPropagation()

				if (expanded) {
					setExpanded(false)
					toggleButton?.blur()
				} else {
					if (toggleButton !== document.activeElement) {
						toggleButton?.focus()
					} else {
						toggleButton?.blur()
					}
				}
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [expanded, handleToggle])

	const devBarRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (devBarRef.current) {
			function handleClickOutside(event: MouseEvent) {
				if (expanded && !devBarRef.current?.contains(event.target as Node)) {
					setExpanded(false)
				}
			}
			window.addEventListener('click', handleClickOutside)
			return () => window.removeEventListener('click', handleClickOutside)
		}
	}, [expanded])

	return (
		<section
			ref={devBarRef}
			data-transparent
			data-overrides-lucide-icons
			data-expanded={dataAttribute(expanded)}
			data-small-screen={dataAttribute(isSmallScreen)}
			className={className(null)}
			onKeyDown={event => {
				if (event.code === 'Escape') {
					if (expanded) {
						event.stopPropagation()
						setExpanded(false)
					} else if (document.activeElement && document.activeElement instanceof HTMLElement) {
						document.activeElement.blur()
					}
				}
			}}
		>
			<style>{`svg { pointer-events: none }`}</style>
			<div className={className('content')}>
				<FocusScope contain={expanded} restoreFocus>
					<div
						data-expanded={dataAttribute(expanded)}
						id="dev-bar-toggle-button-target"
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

						<Divider />

						<div className={className('panels')}>
							<SmallScreenContext.Provider value={isSmallScreen}>{children}</SmallScreenContext.Provider>
						</div>

						<Divider />
					</div>

					<button
						id="dev-bar-toggle-button"
						aria-label="Toggle Contember Developer Toolbar"
						aria-controls="dev-bar-toggle-button-target"
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
	const className = useClassNameFactory('devBar')
	const isSmallScreen = useSmallScreenContext()
	const [expanded, setExpanded] = useState(false)
	const id = `cui-devBar-panel-${useId()}`
	// const mouseIsOver = useRef(false)

	const handleOpen = useReferentiallyStableCallback(() => {
		setExpanded(true)
	})

	const handleToggle = useReferentiallyStableCallback(() => {
		// if (mouseIsOver.current && expanded) {
		// 	return
		// }

		setExpanded(expanded => !expanded)
	})

	const handleClose = useReferentiallyStableCallback(() => {
		setExpanded(false)
	})


	return (
		<div
			data-expanded={dataAttribute(expanded)}
			className={className('trigger')}
			onMouseEnter={useReferentiallyStableCallback(event => {
				// mouseIsOver.current = true
				handleOpen()
			})}
			onMouseLeave={useReferentiallyStableCallback(event => {
				// mouseIsOver.current = false
				handleClose()
			})}
			onKeyDown={useReferentiallyStableCallback(event => {
				if (expanded && event.code === 'Escape') {
					event.stopPropagation()
					handleClose()
				}
			})}
		>
			<button
				tabIndex={0}
				aria-haspopup="dialog"
				aria-controls={id}
				aria-expanded={expanded}
				className={className('trigger-label')}
				onClick={handleToggle}
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
