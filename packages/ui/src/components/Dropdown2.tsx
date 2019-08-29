import * as React from 'react'
import { createPortal } from 'react-dom'
import { Manager, Reference, Popper } from 'react-popper'
import { Collapsible } from './Collapsible'
import { Button, ButtonProps } from './forms'

export type DropdownAlignment = 'start' | 'end' | 'auto'

interface Dropdown2RenderProps {
	requestClose: () => void
}

export interface Dropdown2Props {
	buttonProps?: ButtonProps // @TODO: omit 'onClick' and 'Component'
	alignment?: DropdownAlignment
	children?: React.ReactElement | ((props: Dropdown2RenderProps) => React.ReactNode)
}

const alignmentToPlacement = (alignment: DropdownAlignment) => {
	if (alignment === 'start') {
		return 'bottom-start'
	} else if (alignment === 'end') {
		return 'bottom-end'
	} else {
		return 'auto'
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

export const Dropdown2 = React.memo(({ alignment = 'start', ...props }: Dropdown2Props) => {
	const [isOpen, setIsOpen] = React.useState(false)
	const toggleIsOpen = React.useCallback(() => {
		setIsOpen(!isOpen)
	}, [isOpen])
	const close = React.useCallback(() => {
		setIsOpen(false)
	}, [])
	const refs = useCloseOnEscapeOrClickOutside<HTMLDivElement, HTMLDivElement>(isOpen, close)

	return (
		<Manager>
			<div className="dropdown2">
				<Reference>
					{({ ref }) => (
						<div className="dropdown2-handle" ref={ref}>
							<Button ref={refs.buttonRef} {...props.buttonProps} onClick={toggleIsOpen} />
						</div>
					)}
				</Reference>
				{createPortal(
					<Popper placement={alignmentToPlacement(alignment)}>
						{({ ref, style, placement }) => (
							<div ref={refs.contentRef} className="dropdown2-content" style={style} data-placement={placement}>
								<Collapsible expanded={isOpen} transition="fade">
									<div ref={ref} className="dropdown2-content-in">
										{typeof props.children === 'function' ? props.children({ requestClose: close }) : props.children}
									</div>
								</Collapsible>
							</div>
						)}
					</Popper>,
					document.body,
				)}
			</div>
		</Manager>
	)
})
