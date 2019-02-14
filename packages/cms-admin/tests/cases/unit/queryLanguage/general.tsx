import { expect } from 'chai'
import 'mocha'
import * as React from 'react'
import { ToOne } from '../../../../src/binding/coreComponents'
import { Environment } from '../../../../src/binding/dao'
import { TextField } from '../../../../src/binding/facade'
import { QueryLanguage } from '../../../../src/binding/queryLanguage'

describe('query language parser', () => {
	it('should resolve variables adhering to the principle maximal munch', () => {
		const environment = new Environment({
			ab: 456,
			a: 123,
			x: "'x'",
			dimensions: {}
		})
		expect(
			QueryLanguage.wrapRelativeSingleField(
				'a(a=$a).ab(ab = $ab).x(x = $x).foo',
				name => <TextField name={name} />,
				environment
			)
		).eql(
			<ToOne.AtomicPrimitive field="a" reducedBy={{ a: 123 }} environment={environment}>
				<ToOne.AtomicPrimitive field="ab" reducedBy={{ ab: 456 }} environment={environment}>
					<ToOne.AtomicPrimitive field="x" reducedBy={{ x: 'x' }} environment={environment}>
						<TextField name="foo" />
					</ToOne.AtomicPrimitive>
				</ToOne.AtomicPrimitive>
			</ToOne.AtomicPrimitive>
		)
	})

	it('should resolve variables with multiple levels of replacement', () => {
		const environment = new Environment({
			ab: 456,
			a: 'ab = $ab',
			dimensions: {}
		})
		expect(QueryLanguage.wrapRelativeSingleField('a($a).foo', name => <TextField name={name} />, environment)).eql(
			<ToOne.AtomicPrimitive field="a" reducedBy={{ ab: 456 }} environment={environment}>
				<TextField name="foo" />
			</ToOne.AtomicPrimitive>
		)
	})
})
