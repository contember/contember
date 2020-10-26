import * as uvuAssert from 'uvu/assert'
import { Message } from 'uvu/assert'
export * from 'uvu/assert'

/*
based on https://github.com/lukeed/uvu/blob/30c10e038e5b99c993f26b93bf411c966a9896eb/src/assert.js#L26, because it is not exported
 */
export function assert(
	bool: boolean,
	actual: any,
	expects: any,
	operator: string,
	detailer: false | ((actual: any, expected: any) => string),
	backup: string,
	msg?: uvuAssert.Message,
) {
	if (bool) {
		return
	}
	const message = msg || backup
	if (message instanceof Error) {
		throw message
	}
	const details = (detailer && detailer(actual, expects)) || undefined
	throw new uvuAssert.Assertion({ actual, expects, operator, message, details, generated: !msg })
}

/*
based on https://github.com/lukeed/uvu/blob/30c10e038e5b99c993f26b93bf411c966a9896eb/src/assert.js#L80
with async function support
 */
export async function throwsAsync(
	cb: Promise<any> | (() => Promise<any>),
	exp?: uvuAssert.Message | RegExp | Function,
	msg?: uvuAssert.Message,
) {
	if (!msg && typeof exp === 'string') {
		msg = exp
		exp = undefined
	}

	try {
		await (typeof cb === 'function' ? cb() : cb)
		assert(false, false, true, 'throws', false, 'Expected function to throw', msg)
	} catch (err) {
		if (err instanceof uvuAssert.Assertion) throw err

		if (typeof exp === 'function') {
			assert(exp(err), false, true, 'throws', false, 'Expected function to throw matching exception', msg)
		} else if (exp instanceof RegExp) {
			let tmp = '`' + String(exp) + '`'
			assert(
				exp.test(err.message),
				false,
				true,
				'throws',
				false,
				`Expected function to throw exception matching ${tmp} pattern`,
				msg,
			)
		}
	}
}

export const contains = <T>(actual: T[] | Iterable<T>, expects: T, msg?: Message): void => {
	const actualArr = [...actual]
	assert(
		actualArr.includes(expects),
		actualArr,
		expects,
		'contains',
		false,
		'Expected value to include the element',
		msg,
	)
}
export const not = {
	...uvuAssert.not,
	contains: <T>(actual: T[] | Iterable<T>, expects: T, msg?: Message): void => {
		const actualArr = [...actual]
		assert(
			!actualArr.includes(expects),
			actualArr,
			expects,
			'not.contains',
			false,
			'Expected value not to include the element',
			msg,
		)
	},
}
