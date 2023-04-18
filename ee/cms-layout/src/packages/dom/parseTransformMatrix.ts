import { assert, isNumber } from '../assert-types'

const MATRIX_REG_EXP = /^matrix\((.+)\)/

function isTransformMatrixTuple(value: unknown): value is [number, number, number, number, number, number] {
	if (Array.isArray(value) && value.length === 6 && value.filter(isNumber).length === 6) {
		return true
	} else {
		return false
	}
}

/**
 * Parses a CSS transform matrix string into an object.
 *
 * @param transform CSS transform matrix string.
 * @returns Object with the transform matrix values or undefined.
 */
export function parseTransformMatrix(transform = '') {
	let matches: RegExpMatchArray | null = null

	if (matches = transform.match(MATRIX_REG_EXP)) {
		const vector = matches[1].split(',').map(value => parseFloat(value))
		assert('transform matrix is tuple of six numbers', vector, isTransformMatrixTuple)

		return {
			scaleX: vector[0],
			skewY: vector[1],
			skewX: vector[2],
			scaleY: vector[3],
			translateX: vector[4],
			translateY: vector[5],
		}
	}
}
