import { describe, expect, it } from 'vitest'
import * as renderer from 'react-test-renderer'
import { CurrentRequestContext, Page, Pages, RequestState } from '../../../../../src'
import { ReactNode } from 'react'

function expectRequest(pages: ReactNode, request: RequestState) {
	const el = renderer.create(
		<CurrentRequestContext.Provider value={request}>
			{pages}
		</CurrentRequestContext.Provider>,
	)

	return expect(el.toJSON())
}

describe('Pages', () => {
	it('support single Page as child', () => {
		const pages = <Pages><Page name="foo">Foo</Page></Pages>
		expectRequest(pages, { pageName: 'foo', parameters: {}, dimensions: {} }).toMatchInlineSnapshot('"Foo"')
	})

	it('support multiple Page as children', () => {
		const pages = (
			<Pages>
				<Page name="foo">Foo</Page>
				<Page name="bar">Bar</Page>
			</Pages>
		)

		expectRequest(pages, { pageName: 'foo', parameters: {}, dimensions: {} }).toMatchInlineSnapshot('"Foo"')
		expectRequest(pages, { pageName: 'bar', parameters: {}, dimensions: {} }).toMatchInlineSnapshot('"Bar"')
	})

	it('support pageMap with pageName as key and ReactElement as value', () => {
		const pages = <Pages children={{ foo: <>Foo</>, bar: <>Bar</> }} />
		expectRequest(pages, { pageName: 'foo', parameters: {}, dimensions: {} }).toMatchInlineSnapshot('"Foo"')
		expectRequest(pages, { pageName: 'bar', parameters: {}, dimensions: {} }).toMatchInlineSnapshot('"Bar"')
	})

	it('support pageMap with pageName as key and ComponentType as value', () => {
		const pages = <Pages children={{ foo: () => <>Foo</>, bar: () => <>Bar</> }} />
		expectRequest(pages, { pageName: 'foo', parameters: {}, dimensions: {} }).toMatchInlineSnapshot('"Foo"')
		expectRequest(pages, { pageName: 'bar', parameters: {}, dimensions: {} }).toMatchInlineSnapshot('"Bar"')
	})

	it('support pageMap with PageProviderElement as value', () => {
		const pages = <Pages children={{ fooX: <Page name="foo">Foo</Page>, barX: <Page name="bar">Bar</Page> }} />
		expectRequest(pages, { pageName: 'foo', parameters: {}, dimensions: {} }).toMatchInlineSnapshot('"Foo"')
		expectRequest(pages, { pageName: 'bar', parameters: {}, dimensions: {} }).toMatchInlineSnapshot('"Bar"')
	})

	it('support pageMap with path as key and as LazyPageModule as value', () => {
		const pages = (
			<Pages children={{
				'./pages/foo.tsx': async () => {
					return {
						default: <>Foo</>,
					}
				},

				'./pages/bar.tsx': async () => {
					return {
						default: () => <>Bar</>,
					}
				},
			}} />
		)

		expectRequest(pages, { pageName: 'foo', parameters: {}, dimensions: {} }).toMatchInlineSnapshot(`
			<div
			  className="cui-aether cui-containerSpinner"
			>
			  <div
			    className="cui-spinner"
			  />
			</div>
		`)
		expectRequest(pages, { pageName: 'bar', parameters: {}, dimensions: {} }).toMatchInlineSnapshot(`
			<div
			  className="cui-aether cui-containerSpinner"
			>
			  <div
			    className="cui-spinner"
			  />
			</div>
		`)
	})

	it('support pageMap with path as key and as EagerPageModule as value (multiple entries)', () => {
		const pages = (
			<Pages children={{
				'./pages/foo.tsx': {
					default: <>Foo</>,
				},

				'./pages/foobar.tsx': {
					default: () => <>FooBar</>,
				},

				'./pages/lorem/ipsum.tsx': {
					edit: () => <>Lorem Ipsum Edit</>,
					list: () => <>Lorem Ipsum List</>,
				},
			}} />
		)

		expectRequest(pages, { pageName: 'foo', parameters: {}, dimensions: {} }).toMatchInlineSnapshot('"Foo"')
		expectRequest(pages, { pageName: 'foobar', parameters: {}, dimensions: {} }).toMatchInlineSnapshot('"FooBar"')
		expectRequest(pages, { pageName: 'lorem/ipsum/edit', parameters: {}, dimensions: {} }).toMatchInlineSnapshot('"Lorem Ipsum Edit"')
		expectRequest(pages, { pageName: 'lorem/ipsum/list', parameters: {}, dimensions: {} }).toMatchInlineSnapshot('"Lorem Ipsum List"')
	})

	it('support pageMap with path as key and as EagerPageModule as value (single entry)', () => {
		const pages = (
			<Pages children={{
				'./pages/index.tsx': {
					default: <>Index</>,
				},
			}} />
		)

		expectRequest(pages, { pageName: 'index', parameters: {}, dimensions: {} }).toMatchInlineSnapshot('"Index"')
	})
})
