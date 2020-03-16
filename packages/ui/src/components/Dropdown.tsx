import * as React from 'react'
import { MouseEventHandler } from 'react'
import { Manager, Popper, PopperProps, Reference } from 'react-popper'
import { useClassNamePrefix, useCloseOnEscapeOrClickOutside } from '../auxiliary'
import { DropdownAlignment } from '../types'
import { assertNever } from '../utils'
import { Collapsible } from './Collapsible'
import { Button, ButtonBasedButtonProps } from './forms'
import { Portal } from './Portal'

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
	const suppliedButtonOnClickHandler = props.buttonProps && props.buttonProps.onClick
	const [isOpen, setIsOpen] = React.useState(false)
	const onButtonClick = React.useCallback<MouseEventHandler<HTMLButtonElement>>(
		e => {
			setIsOpen(!isOpen)
			suppliedButtonOnClickHandler && suppliedButtonOnClickHandler(e)
		},
		[isOpen, suppliedButtonOnClickHandler],
	)
	const close = React.useCallback(() => {
		setIsOpen(false)
	}, [])
	const refs = useCloseOnEscapeOrClickOutside<HTMLDivElement, HTMLDivElement>(isOpen, close)

	const contentContainerFromContent = React.useContext(DropdownContentContainerContext)
	const contentContainer = props.contentContainer || contentContainerFromContent || document.body

	const prefix = useClassNamePrefix()

	const { children, renderContent, renderToggle } = props
	const popperRenderProp = React.useCallback<PopperProps['children']>(
		({ ref, style, placement }) => (
			<div ref={refs.contentRef} className={`${prefix}dropdown-content`} style={style} data-placement={placement}>
				<Collapsible expanded={isOpen} transition="fade">
					{renderContent ? (
						renderContent({ ref: ref })
					) : (
						<div ref={ref} className={`${prefix}dropdown-content-in`}>
							{typeof children === 'function' ? children({ requestClose: close }) : children}
						</div>
					)}
				</Collapsible>
			</div>
		),
		[renderContent, close, isOpen, prefix, children, refs.contentRef],
	)

	return (
		<Manager>
			<div className={`${prefix}dropdown`}>
				<Reference>
					{({ ref }) => (
						<div className={`${prefix}dropdown-button`} ref={ref}>
							{renderToggle ? (
								renderToggle({ ref: refs.buttonRef, onClick: onButtonClick })
							) : (
								<Button ref={refs.buttonRef} {...props.buttonProps} onClick={onButtonClick} />
							)}
						</div>
					)}
				</Reference>
				<Portal to={contentContainer}>
					<Popper placement={'top' || alignmentToPlacement(props.alignment)}>{popperRenderProp}</Popper>
				</Portal>
			</div>
		</Manager>
	)
})
Dropdown.displayName = 'Dropdown'

interface Dropdown2Props extends DropdownProps {
	ButtonComponent: React.ReactType<any>
	buttonProps: any
}

export const Dropdown2 = React.memo((props: Dropdown2Props) => {
	const suppliedButtonOnClickHandler = props.buttonProps && props.buttonProps.onClick
	const [isOpen, setIsOpen] = React.useState(false)
	const onButtonClick = React.useCallback<MouseEventHandler<HTMLButtonElement>>(
		e => {
			setIsOpen(!isOpen)
			suppliedButtonOnClickHandler && suppliedButtonOnClickHandler(e)
		},
		[isOpen, suppliedButtonOnClickHandler],
	)
	const close = React.useCallback(() => {
		setIsOpen(false)
	}, [])
	const refs = useCloseOnEscapeOrClickOutside<HTMLDivElement, HTMLDivElement>(isOpen, close)

	const contentContainerFromContent = React.useContext(DropdownContentContainerContext)
	const contentContainer = props.contentContainer || contentContainerFromContent || document.body

	const prefix = useClassNamePrefix()

	const { children, ButtonComponent } = props
	const popperRenderProp = React.useCallback<PopperProps['children']>(
		({ ref, style, placement }) => (
			<div ref={refs.contentRef} className={`${prefix}dropdown2-content`} style={style} data-placement={placement}>
				<Collapsible expanded={isOpen} transition="fade">
					<div ref={ref} className={`${prefix}dropdown-content-in`}>
						{typeof children === 'function' ? children({ requestClose: close }) : children}
					</div>
				</Collapsible>
			</div>
		),
		[close, isOpen, prefix, children, refs.contentRef],
	)

	return (
		<Manager>
			<div className={`${prefix}dropdown`}>
				Dp2
				<Reference>
					{({ ref }) => (
						<div className={`${prefix}dropdown-button`} ref={ref}>
							<ButtonComponent ref={refs.buttonRef} {...props.buttonProps} onClick={onButtonClick} />
						</div>
					)}
				</Reference>
				<Portal to={contentContainer}>
					<Popper placement={'top' || alignmentToPlacement(props.alignment)}>{popperRenderProp}</Popper>
				</Portal>
			</div>
		</Manager>
	)
})
Dropdown.displayName = 'Dropdown2'

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
