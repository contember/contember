import cn from 'classnames'
import {
	createContext,
	memo,
	MouseEvent as ReactMouseEvent,
	MouseEventHandler,
	ReactElement,
	ReactNode,
	Ref,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { usePopper } from 'react-popper'
import { useClassNamePrefix, useCloseOnClickOutside, useCloseOnEscape } from '../auxiliary'
import type { DropdownAlignment } from '../types'
import { assertNever, toViewClass } from '../utils'
import { Collapsible } from './Collapsible'
import { Button, ButtonProps } from './Forms'
import { Portal } from './Portal'

export interface DropdownRenderProps {
	requestClose: () => void
	update: () => void
	forceUpdate: () => void
}

export interface DropdownProps {
	renderToggle?: (props: {
		ref: Ref<HTMLElement>
		onClick: (event: ReactMouseEvent<HTMLElement, MouseEvent>) => void
	}) => ReactNode
	renderContent?: (props: DropdownRenderProps) => ReactNode
	buttonProps?: ButtonProps
	alignment?: DropdownAlignment
	strategy?: 'absolute' | 'fixed'
	contentContainer?: HTMLElement
	children?: ReactElement | ((props: DropdownRenderProps) => ReactNode)
	styledContent?: boolean
	onDismiss?: () => void
}

const alignmentToPlacement = (alignment: DropdownAlignment | undefined) => {
	if (alignment === 'start') {
		return 'bottom-start'
	} else if (alignment === 'end') {
		return 'bottom-end'
	} else if (alignment === 'center' || alignment === 'default' || alignment === undefined) {
		return 'bottom'
	} else if (alignment === 'top') {
		return 'top'
	} else if (alignment === 'right') {
		return 'right'
	} else {
		return assertNever(alignment)
	}
}

const noop = () => {}

export const DropdownContentContainerContext = createContext<HTMLElement | undefined>(undefined)
DropdownContentContainerContext.displayName = 'DropdownContentContainerContext'

/**
 * @group UI
 */
export const Dropdown = memo((props: DropdownProps) => {
	const [isOpen, setIsOpen] = useState(false)
	const [isTransitioning, setIsTransitioning] = useState(false)

	const onDismiss = props.onDismiss
	const isActive = isOpen || isTransitioning

	const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
	const [popperElement, setPopperElement] = useState<HTMLElement | null>(null)

	const placement = alignmentToPlacement(props.alignment)
	const { styles, attributes, forceUpdate, update } = usePopper(
		isActive ? referenceElement : null,
		isActive ? popperElement : null,
		{ placement, strategy: props.strategy },
	)

	const suppliedButtonOnClickHandler = props.buttonProps && props.buttonProps.onClick
	const onButtonClick = useCallback<MouseEventHandler<HTMLElement>>(
		e => {
			forceUpdate?.()
			setIsOpen(isOpen => !isOpen)
			setIsTransitioning(true)
			suppliedButtonOnClickHandler && suppliedButtonOnClickHandler(e as ReactMouseEvent<HTMLButtonElement>)
		},
		[forceUpdate, suppliedButtonOnClickHandler],
	)
	const close = useCallback(() => {
		setIsOpen(false)
		setIsTransitioning(true)
	}, [])

	const dismiss = useCallback(() => {
		close()
		onDismiss?.()
	}, [close, onDismiss])

	useCloseOnEscape({ isOpen, close: dismiss })
	useCloseOnClickOutside({ isOpen, close: dismiss, contents: useMemo(() => [referenceElement, popperElement], [referenceElement, popperElement]) })

	const contentContainerFromContent = useContext(DropdownContentContainerContext)
	const contentContainer = props.contentContainer || contentContainerFromContent || document.body

	const prefix = useClassNamePrefix()

	const { children, renderContent, renderToggle, styledContent = true } = props

	const renderProps: DropdownRenderProps = {
		requestClose: close,
		forceUpdate: forceUpdate ?? noop,
		update: update ?? noop,
	}

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
								renderContent(renderProps)
							) : (
								<div className={cn(`${prefix}dropdown-content-in`, toViewClass('unstyled', !styledContent))}>
									{typeof children === 'function' ? children(renderProps) : children}
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
	children?: ReactNode
}

export const DropdownContentContainerProvider = memo((props: DropdownContainerProviderProps) => {
	const [contentContainer, setContentContainer] = useState<HTMLElement | undefined>(undefined)
	const contentContainerRef = useRef<HTMLDivElement>(null)
	useEffect(() => {
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
