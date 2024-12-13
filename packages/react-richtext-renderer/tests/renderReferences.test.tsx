import { describe, expect, test } from 'bun:test'
import { RichText } from '../src'
import { render } from '@testing-library/react'

describe('reference render', () => {

	test('render ref', () => {
		const block = {
			content: { 'formatVersion': 1, 'children': [{ 'type': 'reference', 'children': [{ 'text': '' }], 'referenceId': '30d83f6b-fca7-4130-9fa4-4ea3de93971b' }] },
			id: '1',
			references: {
				'30d83f6b-fca7-4130-9fa4-4ea3de93971b': {
					id: '30d83f6b-fca7-4130-9fa4-4ea3de93971b',
					type: 'image',
					url: 'https://example.com/image.png',
				},
			},
		}
		expect(render(<RichText
			blocks={[block]}
			referenceRenderers={{
				image: ({ reference }) => <img src={reference.url} />,
			}}
		/>).container.innerHTML)
			.toEqual(`<img src="https://example.com/image.png">`)
	})

	test('nested reference', () => {
		const block = {
			content: { 'formatVersion': 1, 'children': [{ 'type': 'paragraph', 'children': [{ 'text': 'Lorem ipsum ' }, { 'type': 'reference', 'children': [{ 'text': 'dolor' }], 'referenceId': '21c471a6-ae63-4d5d-bb5d-412b61519cad' }, { 'text': ' sit amet.' }] }] } as const,
			id: '1',
			references: {
				'21c471a6-ae63-4d5d-bb5d-412b61519cad': {
					id: '21c471a6-ae63-4d5d-bb5d-412b61519cad',
					type: 'link',
					url: 'https://example.com/',
				},
			},
		}
		expect(render(<RichText
			blocks={[block]}
			referenceRenderers={{
				link: ({ reference }) => <a href={reference.url} />,
			}}
		/>).container.innerHTML)
			.toEqual(`<p data-contember-type="paragraph">Lorem ipsum <a href="https://example.com/"></a> sit amet.</p>`)
	})


	test('undefined reference', () => {
		const block = {
			content: { 'formatVersion': 1, 'children': [{ 'type': 'paragraph', 'children': [{ 'text': 'Lorem ipsum ' }, { 'type': 'reference', 'children': [{ 'text': 'dolor' }], 'referenceId': '21c471a6-ae63-4d5d-bb5d-412b61519cad' }, { 'text': ' sit amet.' }] }] } as const,
			id: '1',
			references: {},
		}
		expect(() => {
			render(<RichText
				blocks={[block]}
				referenceRenderers={{
					link: ({ reference }) => <a href={reference.url} />,
				}}
			/>)
		}).toThrow()
	})

	test('undefined reference handling', () => {
		const block = {
			content: { 'formatVersion': 1, 'children': [{ 'type': 'paragraph', 'children': [{ 'text': 'Lorem ipsum ' }, { 'type': 'reference', 'children': [{ 'text': 'dolor' }], 'referenceId': '21c471a6-ae63-4d5d-bb5d-412b61519cad' }, { 'text': ' sit amet.' }] }] } as const,
			id: '1',
			references: {},
		}
		expect(render(<RichText
			blocks={[block]}
			undefinedReferenceHandler={id => ({
				reference: {
					id,
					type: 'err',
				},
				referenceType: 'err',
				referenceRenderer: () => <div>err</div>,
			})}
			referenceRenderers={{
				link: ({ reference }) => <a href={reference.url} />,
			}}
		/>).container.innerHTML,
		).toEqual(`<p data-contember-type="paragraph">Lorem ipsum <div>err</div> sit amet.</p>`)
	})
})
