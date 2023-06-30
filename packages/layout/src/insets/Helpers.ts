import { assert, isNonNegativeNumber, px } from '@contember/utilities'
import type { ContainerInsets, ContainerOffsets } from './Types'
import { ElementRect } from './Types'

export function diffContainerInsetsFromElementRects(
	outerRect: ElementRect,
	innerRect: ElementRect,
): ContainerInsets {
	return {
		top: Math.max(0, innerRect.top - outerRect.top),
		left: Math.max(0, innerRect.left - outerRect.left),
		right: Math.max(0, outerRect.right - innerRect.right),
		bottom: Math.max(0, outerRect.bottom - innerRect.bottom),
	}
}

export function combineElementInsets(...insets: Array<Partial<ContainerInsets> | null | undefined>): ContainerInsets {
	return insets.reduce(
		(outer: ContainerInsets, inner: Partial<ContainerInsets> | null | undefined) => ({
			bottom: Math.max(0, inner?.bottom ?? 0, outer?.bottom ?? 0),
			left: Math.max(0, inner?.left ?? 0, outer?.left ?? 0),
			right: Math.max(0, inner?.right ?? 0, outer?.right ?? 0),
			top: Math.max(0, inner?.top ?? 0, outer?.top ?? 0),
		}), { bottom: 0, left: 0, right: 0, top: 0 })
}

function clampSingleElementInset(containerInset: number | undefined, elementInset: number): number {
	if (isNonNegativeNumber(containerInset)) {
		return elementInset >= containerInset ? containerInset : 0
	} else {
		return 0
	}
}

function clampElementInsets(containerInsets: ContainerInsets | null | undefined, elementInsets: ContainerInsets): ContainerInsets {
	return {
		bottom: clampSingleElementInset(containerInsets?.bottom, elementInsets.bottom),
		left: clampSingleElementInset(containerInsets?.left, elementInsets.left),
		right: clampSingleElementInset(containerInsets?.right, elementInsets.right),
		top: clampSingleElementInset(containerInsets?.top, elementInsets.top),
	}
}

function getSingleElementInset(containerInset: number | undefined, elementOffset: number | undefined): number {
	if (isNonNegativeNumber(containerInset)) {
		return Math.max(0, containerInset - (elementOffset ?? 0))
	} else {
		return 0
	}
}

export function getElementInsets(containerInsets: ContainerInsets | null | undefined, elementOffsets: ContainerOffsets | null | undefined): ContainerInsets {
	return clampElementInsets(containerInsets, {
		bottom: getSingleElementInset(containerInsets?.bottom, elementOffsets?.offsetBottom),
		left: getSingleElementInset(containerInsets?.left, elementOffsets?.offsetLeft),
		right: getSingleElementInset(containerInsets?.right, elementOffsets?.offsetRight),
		top: getSingleElementInset(containerInsets?.top, elementOffsets?.offsetTop),
	})
}

export function getScreenInnerBoundingRect(): ElementRect {
	const { innerHeight, innerWidth } = typeof window === 'object' ? window : { innerHeight: 0, innerWidth: 0 }

	return {
		bottom: innerHeight,
		height: innerHeight,
		left: 0,
		right: innerWidth,
		top: 0,
		width: innerWidth,
		x: 0,
		y: 0,
	}
}

function isCSSPrefix(value: unknown): value is `--${string}` {
	return typeof value === 'string' && value.startsWith('--') ? true : false
}

type ScreenInsetsToCSSCustomProperties<
	P extends string,
	T extends Readonly<Record<string, number | null>>,
> = {
	[K in keyof T as `${P}-${string & K}`]: `${T[K]}px`;
} & {
		[K in keyof T as `${P}-on-${string & K}`]: '0' | '1';
	}

export function screenInsetsToCSSCustomProperties<
	P extends string,
	T extends Readonly<Record<string, number | null>>,
	>(value: T, prefix: P): ScreenInsetsToCSSCustomProperties<P, T> {
	assert('prefix is CSS custom property prefix', prefix, isCSSPrefix)
	const onPrefix = `--${prefix.slice(1)}-on`

	const entries = [] as Array<[string, string]>

	Object.entries(value).filter(([_key_, value]) => {
		return value !== null && value !== undefined
	}).forEach(([key, value]) => {
		entries.push([`${prefix}-${key}`, px(value)])
		entries.push([`${onPrefix}-${key}`, value && value > 0 ? '1' : '0'])
	})

	return Object.fromEntries(entries) as ScreenInsetsToCSSCustomProperties<P, T>
}
