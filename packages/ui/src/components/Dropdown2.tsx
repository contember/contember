import * as React from 'react'
import { Manager, Reference, Popper } from 'react-popper'
import { Collapsible } from './Collapsible'

export type DropdownAlignment = 'start' | 'end' | 'auto'

export interface Dropdown2Props {
	isOpen: boolean
	handle: React.ReactNode
	alignment?: DropdownAlignment
	children?: React.ReactNode
	onCloseRequest?: () => void
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

const useRequestCloseOnEscapeOrClickOutside = <T extends Node>(isOpen: boolean, requestClose: () => void) => {
	const wrapperRef = React.useRef<T>(null)

	React.useEffect(() => {
		if (isOpen) {
			const requestCloseOnEscapeKey = (event: KeyboardEvent) => {
				if (event.key === 'Escape') {
					requestClose()
				}
			}
			const requestCloseOnClickOutside = (event: MouseEvent) => {
				if (!(wrapperRef.current && event.target instanceof Node && wrapperRef.current.contains(event.target))) {
					requestClose()
				}
			}

			window.addEventListener('keydown', requestCloseOnEscapeKey)
			window.addEventListener('click', requestCloseOnClickOutside)
			return () => {
				window.removeEventListener('keydown', requestCloseOnEscapeKey)
				window.removeEventListener('click', requestCloseOnClickOutside)
			}
		}
	}, [requestClose, isOpen])

	return wrapperRef
}

export const Dropdown2 = React.memo(({ alignment = 'start', onCloseRequest = () => {}, ...props }: Dropdown2Props) => {
	const wrapperRef = useRequestCloseOnEscapeOrClickOutside<HTMLDivElement>(props.isOpen, onCloseRequest)

	return (
		<Manager>
			<div className="dropdown2" ref={wrapperRef}>
				<Reference>
					{({ ref }) => (
						<div className="dropdown2-handle" ref={ref}>
							{props.handle}
						</div>
					)}
				</Reference>
				<Popper placement={alignmentToPlacement(alignment)}>
					{({ ref, style, placement, arrowProps }) => (
						<div className="dropdown2-content" ref={ref} style={style} data-placement={placement}>
							<Collapsible expanded={props.isOpen} transition="topInsert">
								<div className="dropdown2-arrow" ref={arrowProps.ref} style={arrowProps.style}>
									<div className="dropdown2-arrow-in" />
								</div>
								<div className="dropdown2-content-in">{props.children}</div>
							</Collapsible>
						</div>
					)}
				</Popper>
			</div>
		</Manager>
	)
})
