import cn from 'classnames'
import * as React from 'react'
import { MouseEventHandler } from 'react'
import { usePopper } from 'react-popper'
import { useClassNamePrefix, useRawCloseOnEscapeOrClickOutside } from '../auxiliary'
import { DropdownAlignment } from '../types'
import { assertNever, toViewClass } from '../utils'
import { Collapsible } from './Collapsible'
import { Button, ButtonBasedButtonProps } from './forms'
import { Portal } from './Portal'

export interface DropdownRenderProps {
	requestClose: () => void
}

export interface DropdownProps {
	renderToggle?: (props: {
		ref: React.Ref<HTMLElement>
		onClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void
	}) => React.ReactNode
	renderContent?: (props: DropdownRenderProps) => React.ReactNode
	buttonProps?: ButtonBasedButtonProps
	alignment?: DropdownAlignment
	contentContainer?: HTMLElement
	children?: React.ReactElement | ((props: DropdownRenderProps) => React.ReactNode)
	styledContent?: boolean
	onDismiss?: () => void
}

const alignmentToPlacement = (alignment: DropdownAlignment | undefined) => {
	if (alignment === 'start') {
		return 'bottom-start'
	} else if (alignment === 'end') {
		return 'bottom-end'
	} else if (alignment === 'center' || alignment === 'default' || alignment === undefined) {
		return 'auto'
	} else if (alignment === 'top') {
		return 'top'
	} else {
		return assertNever(alignment)
	}
}

export const DropdownContentContainerContext = React.createContext<HTMLElement | undefined>(undefined)
DropdownContentContainerContext.displayName = 'DropdownContentContainerContext'

export const Dropdown = React.memo((props: DropdownProps) => {
	const [isOpen, setIsOpen] = React.useState(false)
	const [isTransitioning, setIsTransitioning] = React.useState(false)

	const onDismiss = props.onDismiss
	const isActive = isOpen || isTransitioning

	const [referenceElement, setReferenceElement] = React.useState<HTMLElement | null>(null)
	const [popperElement, setPopperElement] = React.useState<HTMLElement | null>(null)
	const { styles, attributes, forceUpdate } = usePopper(
		isActive ? referenceElement : null,
		isActive ? popperElement : null,
	)

	const suppliedButtonOnClickHandler = props.buttonProps && props.buttonProps.onClick
	const onButtonClick = React.useCallback<MouseEventHandler<HTMLElement>>(
		e => {
			forceUpdate?.()
			setIsOpen(isOpen => !isOpen)
			setIsTransitioning(true)
			suppliedButtonOnClickHandler && suppliedButtonOnClickHandler(e as React.MouseEvent<HTMLButtonElement>)
		},
		[forceUpdate, suppliedButtonOnClickHandler],
	)
	const close = React.useCallback(() => {
		setIsOpen(false)
		setIsTransitioning(true)
	}, [])

	const dismiss = React.useCallback(() => {
		close()
		onDismiss?.()
	}, [close, onDismiss])

	useRawCloseOnEscapeOrClickOutside<HTMLDivElement, HTMLDivElement>({
		isOpen,
		close: dismiss,
		reference: referenceElement,
		content: popperElement,
	})

	const contentContainerFromContent = React.useContext(DropdownContentContainerContext)
	const contentContainer = props.contentContainer || contentContainerFromContent || document.body

	const prefix = useClassNamePrefix()

	const { children, renderContent, renderToggle, styledContent = true } = props
	const placement = 'top' || alignmentToPlacement(props.alignment)

	return (
		<>
			{renderToggle ? (
				renderToggle({ ref: setReferenceElement, onClick: onButtonClick })
			) : (
				<Button {...props.buttonProps} onClick={onButtonClick} ref={setReferenceElement} />
			)}
			{isActive && (
				<Portal to={contentContainer}>
					<div
						ref={setPopperElement}
						style={styles.popper}
						{...attributes.popper}
						className={`${prefix}dropdown-content`}
						data-placement={placement}
					>
						<Collapsible
							expanded={isOpen}
							transition="fade"
							onTransitionEnd={() => {
								if (isOpen) {
									return
								}
								setIsTransitioning(false)
							}}
						>
							{renderContent ? (
								renderContent({ requestClose: close })
							) : (
								<div className={cn(`${prefix}dropdown-content-in`, toViewClass('unstyled', !styledContent))}>
									{typeof children === 'function' ? children({ requestClose: close }) : children}
								</div>
							)}
						</Collapsible>
					</div>
				</Portal>
			)}
		</>
	)
})
Dropdown.displayName = 'Dropdown'

export interface DropdownContainerProviderProps {
	children?: React.ReactNode
}

export const DropdownContentContainerProvider = React.memo((props: DropdownContainerProviderProps) => {
	const [contentContainer, setContentContainer] = React.useState<HTMLElement | undefined>(undefined)
	const contentContainerRef = React.useRef<HTMLDivElement>(null)
	React.useEffect(() => {
		// Run once ref is set
		setContentContainer(contentContainerRef.current || undefined)
	}, [])
	const prefix = useClassNamePrefix()

	return (
		<div className={`${prefix}dropdown-contentContainer`} ref={contentContainerRef}>
			<DropdownContentContainerContext.Provider value={contentContainer}>
				{props.children}
			</DropdownContentContainerContext.Provider>
		</div>
	)
})
DropdownContentContainerProvider.displayName = 'DropdownContentContainerProvider'
