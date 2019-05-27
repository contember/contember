import * as validation from '../../../src/input-validation'
import 'mocha'
import { expect } from 'chai'

describe('input validation', () => {
	it('evaluates rule', () => {
		const r = validation.rules
		const rule = r.conditional(
			r.on('books', r.filter(r.on('deleted', r.equals(false)), r.on('published', r.any(r.equals(true))))),
			r.on('published', r.equals(true))
		)
		console.log(JSON.stringify(rule, null, ' '))
		const author = {
			books: [
				{ published: true, deleted: true },
				{ published: false, deleted: false },
				{ published: true, deleted: false },
			],
			published: true,
		}

		const context = validation.createRootContext(author)

		expect(validation.evaluate(context, rule)).eq(true)
	})
})
