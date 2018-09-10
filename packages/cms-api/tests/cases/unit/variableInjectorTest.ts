import 'mocha'
import { expect } from 'chai'
import VariableInjector from '../../../src/acl/VariableInjector'

describe('variable injector', () => {
	it('injects variable', () => {
		const injector = new VariableInjector({
				site: [1, 2],
				locale: 'cs'
			})
		const result = injector.inject(
			{
				and: [
					{
						post: {
							site: 'site'
						}
					},
					{
						locale: 'locale'
					},
					{
						foo: 'bar'
					}
				]
			}
		)

		expect(result).deep.eq({
			and: [
				{
					post: {
						site: { in: [1, 2] }
					}
				},
				{
					locale: { eq: 'cs' }
				},
				{
					foo: { never: true }
				}
			]
		})
	})
})
