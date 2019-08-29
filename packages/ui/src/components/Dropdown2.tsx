import * as React from 'react'
import { Manager, Reference, Popper } from 'react-popper'
import { Collapsible } from './Collapsible'
import { Button, ButtonProps } from './forms'

export type DropdownAlignment = 'start' | 'end' | 'auto'

export interface Dropdown2Props {
	buttonProps?: ButtonProps // @TODO: omit 'onClick' and 'Component'
	alignment?: DropdownAlignment
	children?: React.ReactNode
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

const useCloseOnEscapeOrClickOutside = <T extends Node>(isOpen: boolean, close: () => void) => {
	const wrapperRef = React.useRef<T>(null)

	React.useEffect(() => {
		if (isOpen) {
			const closeOnEscapeKey = (event: KeyboardEvent) => {
				if (event.key === 'Escape') {
					close()
				}
			}
			const closeOnClickOutside = (event: MouseEvent) => {
				if (!(wrapperRef.current && event.target instanceof Node && wrapperRef.current.contains(event.target))) {
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

	return wrapperRef
}

export const Dropdown2 = React.memo(({ alignment = 'start', ...props }: Dropdown2Props) => {
	const [isOpen, setIsOpen] = React.useState(false)
	const toggleIsOpen = React.useCallback(() => {
		setIsOpen(!isOpen)
	}, [isOpen])
	const close = React.useCallback(() => {
		setIsOpen(false)
	}, [])
	const wrapperRef = useCloseOnEscapeOrClickOutside<HTMLDivElement>(isOpen, close)

	return (
		<Manager>
			<div className="dropdown2" ref={wrapperRef}>
				<Reference>
					{({ ref }) => (
						<div className="dropdown2-handle" ref={ref}>
							<Button {...props.buttonProps} onClick={toggleIsOpen} />
						</div>
					)}
				</Reference>
				<Popper placement={alignmentToPlacement(alignment)}>
					{({ ref, style, placement }) => (
						<div className="dropdown2-content" style={style} data-placement={placement}>
							<Collapsible expanded={isOpen} transition="fade">
								<div ref={ref} className="dropdown2-content-in">
									{props.children}
								</div>
							</Collapsible>
						</div>
					)}
				</Popper>
			</div>
		</Manager>
	)
})
