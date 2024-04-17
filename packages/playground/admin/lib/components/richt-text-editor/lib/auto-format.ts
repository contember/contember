import { AutoformatRule } from '@udecode/plate-autoformat'
import { MARK_BOLD, MARK_ITALIC, MARK_STRIKETHROUGH, MARK_UNDERLINE } from '@udecode/plate-basic-marks'
import { ELEMENT_H1, ELEMENT_H2, ELEMENT_H3, ELEMENT_H4, ELEMENT_H5, ELEMENT_H6 } from '@udecode/plate-heading'
import { preFormat } from './auto-format-utils'

export const autoFormatBlocks: AutoformatRule[] = [
	{
		mode: 'block',
		type: ELEMENT_H1,
		match: '# ',
		preFormat,
	},
	{
		mode: 'block',
		type: ELEMENT_H2,
		match: '## ',
		preFormat,
	},
	{
		mode: 'block',
		type: ELEMENT_H3,
		match: '### ',
		preFormat,
	},
	{
		mode: 'block',
		type: ELEMENT_H4,
		match: '#### ',
		preFormat,
	},
	{
		mode: 'block',
		type: ELEMENT_H5,
		match: '##### ',
		preFormat,
	},
	{
		mode: 'block',
		type: ELEMENT_H6,
		match: '###### ',
		preFormat,
	},
]

export const autoFormatMarks: AutoformatRule[] = [
	{
		mode: 'mark',
		type: [MARK_BOLD, MARK_ITALIC],
		match: '***',
	},
	{
		mode: 'mark',
		type: [MARK_UNDERLINE, MARK_ITALIC],
		match: '__*',
	},
	{
		mode: 'mark',
		type: [MARK_UNDERLINE, MARK_BOLD],
		match: '__**',
	},
	{
		mode: 'mark',
		type: [MARK_UNDERLINE, MARK_BOLD, MARK_ITALIC],
		match: '___***',
	},
	{
		mode: 'mark',
		type: MARK_BOLD,
		match: '**',
	},
	{
		mode: 'mark',
		type: MARK_UNDERLINE,
		match: '__',
	},
	{
		mode: 'mark',
		type: MARK_ITALIC,
		match: '*',
	},
	{
		mode: 'mark',
		type: MARK_ITALIC,
		match: '_',
	},
	{
		mode: 'mark',
		type: MARK_STRIKETHROUGH,
		match: '~~',
	},
]
