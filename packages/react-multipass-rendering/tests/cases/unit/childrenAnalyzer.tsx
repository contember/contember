import 'jasmine'
import * as React from 'react'
import { ChildrenAnalyzer, Terminal } from '../../../src'

interface FooComponentProps {
	foo: string
	baz: number
}
interface BarComponentProps {
	bar: string
	baz: number
}

const FooComponent = (props: FooComponentProps) => null
const BarComponent = (props: BarComponentProps) => null

const simpleFooComponentTree = (
	<>
		<FooComponent foo="abc" baz={123} />
		<FooComponent foo="def" baz={456} />
		<FooComponent foo="ghi" baz={789} />
	</>
)
const simpleFooBarComponentTree = (
	<>
		<FooComponent foo="abc" baz={123} />
		<BarComponent bar="pqr" baz={369} />
		<FooComponent foo="ghi" baz={789} />
	</>
)

describe('children analyzer', () => {
	it('should gather children props', () => {
		const fooTerminal = new Terminal((props: FooComponentProps): FooComponentProps => props)
		const analyzer = new ChildrenAnalyzer<FooComponentProps>([fooTerminal])

		expect(analyzer.processChildren(simpleFooComponentTree, undefined)).toEqual([
			{ foo: 'abc', baz: 123 },
			{ foo: 'def', baz: 456 },
			{ foo: 'ghi', baz: 789 },
		])
	})
	it('should filter terminals by component type', () => {
		const fooTerminal = new Terminal((props: FooComponentProps): FooComponentProps => props, FooComponent)
		const barTerminal = new Terminal(
			(props: BarComponentProps): BarComponentProps => ({
				bar: `${props.bar}${props.bar}`,
				baz: props.baz + 1,
			}),
			BarComponent,
		)
		const analyzer = new ChildrenAnalyzer<FooComponentProps | BarComponentProps>([fooTerminal, barTerminal])

		expect(analyzer.processChildren(simpleFooBarComponentTree, undefined)).toEqual([
			{ foo: 'abc', baz: 123 },
			{ bar: 'pqrpqr', baz: 370 },
			{ foo: 'ghi', baz: 789 },
		])
	})
})
