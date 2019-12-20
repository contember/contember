import * as React from 'react'
import { MouseEventHandler } from 'react'
import { createPortal } from 'react-dom'
import { Manager, Popper, Reference } from 'react-popper'
import { useClassNamePrefix, useComponentClassName } from '../auxiliary'
import { DropdownAlignment } from '../types/DropdownAlignment'
import { assertNever } from '../utils'
import { Collapsible } from './Collapsible'
import { Button, ButtonBasedButtonProps } from './forms'

export interface DropdownRenderProps {
	requestClose: () => void
}

export interface DropdownProps {
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
	} else {
		return assertNever(alignment)
	}
}

const useCloseOnEscapeOrClickOutside = <T extends Node, K extends Node>(isOpen: boolean, close: () => void) => {
	const buttonRef = React.useRef<T>(null)
	const contentRef = React.useRef<K>(null)

	React.useEffect(() => {
		if (isOpen) {
			const closeOnEscapeKey = (event: KeyboardEvent) => {
				if (event.key === 'Escape') {
					close()
				}
			}
			const closeOnClickOutside = (event: MouseEvent) => {
				if (
					!(
						buttonRef.current &&
						contentRef.current &&
						event.target instanceof Node &&
						(buttonRef.current.contains(event.target) || contentRef.current.contains(event.target))
					)
				) {
					close()
				}
			}

			window.addEventListener('keydown', closeOnEscapeKey)
			window.addEventListener('click', closeOnClickOutside)
			return () => {
				window.removeEventListener('keydown', closeOnEscapeKey)
				window.removeEventListener('click', closeOnClickOutside)
			}
		}
	}, [close, isOpen])

	return { buttonRef, contentRef }
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

	return (
		<Manager>
			<div className={`${prefix}dropdown`}>
				<Reference>
					{({ ref }) => (
						<div className={`${prefix}dropdown-button`} ref={ref}>
							<Button ref={refs.buttonRef} {...props.buttonProps} onClick={onButtonClick} />
						</div>
					)}
				</Reference>
				{createPortal(
					<Popper placement={alignmentToPlacement(props.alignment)}>
						{({ ref, style, placement }) => (
							<div
								ref={refs.contentRef}
								className={`${prefix}dropdown-content`}
								style={style}
								data-placement={placement}
							>
								<Collapsible expanded={isOpen} transition="fade">
									<div ref={ref} className={`${prefix}dropdown-content-in`}>
										{typeof props.children === 'function' ? props.children({ requestClose: close }) : props.children}
									</div>
								</Collapsible>
							</div>
						)}
					</Popper>,
					contentContainer,
				)}
			</div>
		</Manager>
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
