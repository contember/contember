import { assert } from '@contember/utilities'
import { useLayoutEffect, useMemo, useState } from 'react'
import { useScopedConsoleRef } from '../debug-context'
import { useReferentiallyStableCallback } from '../referentiallyStable'
import { RefObjectOrElement, unwrapRefValue } from './unwrapRefValue'
import { useOnScrollWithin } from './useOnScrollWithin'
import { useOnWindowResize } from './useOnWindowResize'

export type Offsets = {
	bottom: number;
	left: number;
	right: number;
	top: number;
}

export function useScrollOffsets(refOrElement: RefObjectOrElement<HTMLElement | null> | null, interval: number = 1000 / 60) {
	const { logged } = useScopedConsoleRef('useScrollOffsets').current

	const [top, setTop] = useState(0)
	const [bottom, setBottom] = useState(0)
	const [left, setLeft] = useState(0)
	const [right, setRight] = useState(0)

	const updateScrollOffsetsState = useReferentiallyStableCallback((offsets: Offsets) => {
		logged('Update the offsets:', {
			previous: { bottom, left, right, top },
			next: offsets,
		})

		if (offsets.bottom !== bottom) setBottom(offsets.bottom)
		if (offsets.left !== left) setLeft(offsets.left)
		if (offsets.right !== right) setRight(offsets.right)
		if (offsets.top !== top) setTop(offsets.top)
	})

	const handler = useReferentiallyStableCallback(() => {
		const maybeScrollContent = unwrapRefValue(refOrElement) ?? document

		if (maybeScrollContent) {
			updateScrollOffsetsState(
				getElementScrollOffsets(maybeScrollContent),
			)
		}
	})

	useOnScrollWithin(refOrElement, handler, interval)
	useOnWindowResize(handler)
	useLayoutEffect(handler, [handler])

	return useMemo(() => ({ bottom, left, right, top }), [bottom, left, right, top])
}

function isIntrinsicScrollElement(element: unknown): element is Document {
	return element instanceof HTMLBodyElement
		|| element instanceof HTMLHtmlElement
		|| element instanceof DocumentType
		|| element instanceof Document
		|| element instanceof HTMLDocument
}

function getIntrinsicScrollContainer(element: HTMLElement | Document): HTMLElement {
	const html = document.body.parentElement
	assert('HTML element exists', html, (value): value is HTMLElement => value instanceof HTMLElement)

	if (isIntrinsicScrollElement(element)) {
		return html
	} else {
		return element
	}
}

function getElementScrollOffsets(element: HTMLElement | Document): Offsets {
	const isIntrinsicScrolling = isIntrinsicScrollElement(element)
	const scrollContainer = getIntrinsicScrollContainer(element)

	const { scrollLeft, scrollTop, scrollHeight, scrollWidth } = scrollContainer

	const height = isIntrinsicScrolling ? window.innerHeight : scrollContainer.offsetHeight
	const width = isIntrinsicScrolling ? window.innerWidth : scrollContainer.offsetWidth

	const left = Math.round(scrollLeft)
	const top = Math.round(scrollTop)

	const right = Math.round(scrollWidth - width - left)
	const bottom = Math.round(scrollHeight - height - top)

	return { bottom, left, right, top }
}
