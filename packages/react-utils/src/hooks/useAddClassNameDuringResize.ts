import { useLayoutEffect, useRef } from 'react'
import { useReferentiallyStableCallback } from '../referentiallyStable'
import { useOnWindowResize } from './useOnWindowResize'

function intendedFlushOfCSSChangesToCauseImmediateReflow(element: HTMLElement) {
	element.offsetHeight
}

function addClassName(
	className: string,
	element: HTMLElement,
) {
	if (element.classList.contains(className)) {
		element.classList.remove(className)
		intendedFlushOfCSSChangesToCauseImmediateReflow(element)
	}
}

function removeClassName(
	className: string,
	element: HTMLElement,
) {
	if (!element.classList.contains(className)) {
		element.classList.add(className)
		intendedFlushOfCSSChangesToCauseImmediateReflow(element)
	}
}

/**
 * Adds CSS class during resize event to element
 *
 * - Falls back to document.body when no element is specified
 * - Adds CSS class to element also on the initial load
 * - Uses element.classList directly
 *
 * @param className - CSS class to apply during the resize event
 * @param timeoutToRestore - Timeout in milliseconds to wait before finally removing the CSS class
 * @param element - Optional HTML element to apply CSS class to
 */
export function useAddClassNameDuringResize(
	className: string,
	timeoutToRestore: number = 300,
	element?: HTMLElement,
) {
	const timeoutID = useRef<number>()

	const addTemporaryClassName = useReferentiallyStableCallback(() => {
		clearTimeout(timeoutID.current)
		removeClassName(className, element ?? document.body)

		timeoutID.current = setTimeout(() => {
			addClassName(className, element ?? document.body)
		}, timeoutToRestore)

		return () => {
			clearTimeout(timeoutID.current)
		}
	})

	useLayoutEffect(addTemporaryClassName, [addTemporaryClassName])
	useOnWindowResize(addTemporaryClassName)
}
