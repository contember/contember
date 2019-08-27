import * as React from 'react'
import { Manager, Reference, Popper } from 'react-popper'
import { Collapsible } from './Collapsible'
import { useEffect } from 'react'

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

const useRequestCloseOnEscape = (isOpen: boolean, callback: () => void) => {
	useEffect(() => {
		if (isOpen) {
			const requestCloseOnEscapeKey = (event: KeyboardEvent) => {
				if (event.key === 'Escape') {
					callback()
				}
			}

			window.addEventListener('keydown', requestCloseOnEscapeKey)
			return () => {
				window.removeEventListener('keydown', requestCloseOnEscapeKey)
			}
		}
	}, [callback, isOpen])
}

export const Dropdown2 = React.memo(({ alignment = 'start', onCloseRequest = () => {}, ...props }: Dropdown2Props) => {
	useRequestCloseOnEscape(props.isOpen, onCloseRequest)

	return (
		<Manager>
			<div className="dropdown2">
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
