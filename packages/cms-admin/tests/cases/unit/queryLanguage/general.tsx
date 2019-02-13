import { expect } from 'chai'
import 'mocha'
import * as React from 'react'
import { ToOne } from '../../../../src/binding/coreComponents'
import { Environment } from '../../../../src/binding/dao'
import { TextField } from '../../../../src/binding/facade'
import { QueryLanguage } from '../../../../src/binding/queryLanguage'

describe('query language parser', () => {
	it('should resolve variables adhering to the principle maximal munch', () => {
		expect(
			QueryLanguage.wrapRelativeSingleField(
				'a(a=$a).ab(ab = $ab).x(x = $x).foo',
				name => <TextField name={name} />,
				new Environment({
					ab: 456,
					a: 123,
					x: "'x'",
					dimensions: {}
				})
			)
		).eql(
			<ToOne field="a" reducedBy={{ a: 123 }}>
				<ToOne field="ab" reducedBy={{ ab: 456 }}>
					<ToOne field="x" reducedBy={{ x: 'x' }}>
						<TextField name="foo" />
					</ToOne>
				</ToOne>
			</ToOne>
		)
	})

	it('should resolve variables with multiple levels of replacement', () => {
		expect(
			QueryLanguage.wrapRelativeSingleField(
				'a($a).foo',
				name => <TextField name={name} />,
				new Environment({
					ab: 456,
					a: 'ab = $ab',
					dimensions: {}
				})
			)
		).eql(
			<ToOne field="a" reducedBy={{ ab: 456 }}>
				<TextField name="foo" />
			</ToOne>
		)
	})
})
