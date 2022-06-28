import { describe, expect, it } from 'vitest'
import { createEditorWithEssentials, withHeadings } from '../../../../src'
import { Transforms } from 'slate'

describe('heading plugin', () => {
	it('toggles element to heading', () => {
		const editor = createEditorWithEssentials('paragraph')
		withHeadings(editor)
		editor.insertNode({
			type: 'paragraph',
			children: [{ text: 'Hello world' }],
		})
		Transforms.select(editor, [0])
		editor.toggleElement('heading', {
			level: 1,
		})

		expect(editor.children).deep.eq([
			{
				'children': [
					{
						'text': 'Hello world',
					},
				],
				'level': 1,
				'type': 'heading',
			},
		])
	})

	it('toggles element back to paragraph', () => {
		const editor = createEditorWithEssentials('paragraph')
		withHeadings(editor)
		editor.insertNode({
			'children': [{ 'text': 'Hello world' }],
			'level': 1,
			'type': 'heading',
		})
		Transforms.select(editor, [0])
		editor.toggleElement('heading', {
			level: 1,
		})

		expect(editor.children).deep.eq([
			{
				'children': [
					{
						'text': 'Hello world',
					},
				],
				'type': 'paragraph',
			},
		])
	})

	it('converts whole line when converting a selection', () => {
		const editor = createEditorWithEssentials('paragraph')
		withHeadings(editor)
		editor.insertNode({
			type: 'paragraph',
			children: [{ text: 'Hello world' }],
		})
		Transforms.select(editor, {
			anchor: { offset: 5, path: [0, 0] },
			focus: { offset: 0, path: [0, 0] },
		})
		editor.toggleElement('heading', {
			level: 1,
		})

		expect(editor.children).deep.eq([
			{
				'children': [
					{
						'text': 'Hello world',
					},
				],
				'level': 1,
				'type': 'heading',
			},
		])
	})

	it('split heading when inserting a break', () => {
		const editor = createEditorWithEssentials('paragraph')
		withHeadings(editor)
		editor.insertNode({
			'children': [{ 'text': 'Hello world' }],
			'level': 1,
			'type': 'heading',
		})
		Transforms.select(editor, {
			anchor: { offset: 5, path: [0, 0] },
			focus: { offset: 5, path: [0, 0] },
		})
		editor.insertBreak()

		expect(editor.children).deep.eq([
			{
				'children': [
					{
						'text': 'Hello',
					},
				],
				'level': 1,
				'type': 'heading',
			},
			{
				'children': [
					{
						'text': ' world',
					},
				],
				'level': 1,
				'type': 'heading',
			},
		])
	})

	it('join heading with paragraph on backspace', () => {
		const editor = createEditorWithEssentials('paragraph')
		withHeadings(editor)
		editor.insertNode({
			'children': [
				{
					'text': 'Hello',
				},
			],
			'type': 'paragraph',
		})
		editor.insertNode({
			'children': [
				{
					'text': ' world',
				},
			],
			'level': 1,
			'type': 'heading',
		})
		Transforms.select(editor, {
			path: [1, 0],
			offset: 0,
		})
		Transforms.delete(editor, {
			unit: 'character',
			reverse: true,
		})

		expect(editor.children).deep.eq([
			{
				'children': [
					{
						'text': 'Hello world',
					},
				],
				'type': 'paragraph',
			},
		])
	})


	it('join paragraph with heading on backspace', () => {
		const editor = createEditorWithEssentials('paragraph')
		withHeadings(editor)
		editor.insertNode({
			'children': [
				{
					'text': 'Hello',
				},
			],
			'level': 1,
			'type': 'heading',
		})
		editor.insertNode({
			'children': [
				{
					'text': ' world',
				},
			],
			'type': 'paragraph',
		})
		Transforms.select(editor, {
			path: [1, 0],
			offset: 0,
		})
		Transforms.delete(editor, {
			unit: 'character',
			reverse: true,
		})

		expect(editor.children).deep.eq([
			{
				'children': [
					{
						'text': 'Hello world',
					},
				],
				'level': 1,
				'type': 'heading',
			},
		])
	})


	it('insert paragraph on enter', () => {
		const editor = createEditorWithEssentials('paragraph')
		withHeadings(editor)
		editor.insertNode({
			'children': [{ 'text': 'Hello world' }],
			'level': 1,
			'type': 'heading',
		})
		Transforms.select(editor, {
			anchor: { offset: 11, path: [0, 0] },
			focus: { offset: 11, path: [0, 0] },
		})
		editor.insertBreak()

		expect(editor.children).deep.eq([
			{
				'children': [
					{
						'text': 'Hello world',
					},
				],
				'level': 1,
				'type': 'heading',
			},
			{
				'children': [
					{
						'text': '',
					},
				],
				'type': 'paragraph',
			},
		])
	})

})
