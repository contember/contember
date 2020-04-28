import * as React from 'react'
import { MouseEventHandler } from 'react'
import { usePopper } from 'react-popper'
import { useClassNamePrefix, useCloseOnEscapeOrClickOutside } from '../auxiliary'
import { DropdownAlignment } from '../types'
import { assertNever, toViewClass } from '../utils'
import { Collapsible } from './Collapsible'
import { Button, ButtonBasedButtonProps } from './forms'
import { Portal } from './Portal'
import cn from 'classnames'

export interface DropdownRenderProps {
	requestClose: () => void
}

export interface DropdownProps {
	renderToggle?: (props: {
		ref: React.Ref<any>
		onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
	}) => React.ReactNode
	renderContent?: (props: { ref: React.Ref<any> }) => React.ReactNode
	buttonProps?: ButtonBasedButtonProps
	alignment?: DropdownAlignment
	contentContainer?: HTMLElement
	children?: React.ReactElement | ((props: DropdownRenderProps) => React.ReactNode)
	styledContent?: boolean
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
	const [referenceElement, setReferenceElement] = React.useState<HTMLElement | null>(null)
	const [popperElement, setPopperElement] = React.useState<HTMLElement | null>(null)
	const { styles, attributes, forceUpdate } = usePopper(referenceElement, popperElement)

	const suppliedButtonOnClickHandler = props.buttonProps && props.buttonProps.onClick
	const [isOpen, setIsOpen] = React.useState(false)
	const onButtonClick = React.useCallback<MouseEventHandler<HTMLButtonElement>>(
		e => {
			forceUpdate?.()
			setIsOpen(isOpen => !isOpen)
			suppliedButtonOnClickHandler && suppliedButtonOnClickHandler(e)
		},
		[forceUpdate, suppliedButtonOnClickHandler],
	)
	const close = React.useCallback(() => {
		setIsOpen(false)
	}, [])
	const refs = useCloseOnEscapeOrClickOutside<HTMLDivElement, HTMLDivElement>(isOpen, close)

	const contentContainerFromContent = React.useContext(DropdownContentContainerContext)
	const contentContainer = props.contentContainer || contentContainerFromContent || document.body

	const prefix = useClassNamePrefix()

	const { children, renderContent, renderToggle, styledContent = true } = props
	const placement = 'top' || alignmentToPlacement(props.alignment)

	return (
		<div className={`${prefix}dropdown`}>
			<div className={`${prefix}dropdown-button`} ref={setReferenceElement}>
				{renderToggle ? (
					renderToggle({ ref: refs.buttonRef, onClick: onButtonClick })
				) : (
					<Button ref={refs.buttonRef} {...props.buttonProps} onClick={onButtonClick} />
				)}
			</div>
			<Portal to={contentContainer}>
				<div
					ref={setPopperElement}
					style={styles.popper}
					{...attributes.popper}
					className={`${prefix}dropdown-content`}
					data-placement={placement}
				>
					<div ref={refs.contentRef}>
						<Collapsible expanded={isOpen} transition="fade">
							{renderContent ? (
								renderContent({ ref: refs.contentRef })
							) : (
								<div
									ref={refs.contentRef}
									className={cn(`${prefix}dropdown-content-in`, toViewClass('unstyled', !styledContent))}
								>
									{typeof children === 'function' ? children({ requestClose: close }) : children}
								</div>
							)}
						</Collapsible>
					</div>
				</div>
			</Portal>
		</div>
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
