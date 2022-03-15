import { expect, it, describe } from 'vitest'
import { deserializeHtml } from './utils'
import {
	anchorHtmlDeserializer,
	headingHtmlDeserializer,
	listHtmlDeserializerFactory,
	paragraphHtmlDeserializer,
} from '../../../../../src'

describe('editor html deserializer', () => {
	it('deserializes text', () => {
		expect(deserializeHtml(`<p>Hello <span>world</span></p><p>Bar</p>`)).toEqual([{ 'text': 'Hello ' }, { 'text': 'world' }, { 'text': 'Bar' }])
	})
	it('deserializes paragraphs', () => {
		expect(deserializeHtml(`<p>Hello</p> <p>world</p>`, [paragraphHtmlDeserializer])).toEqual([
			{ 'children': [{ 'text': 'Hello' }], 'type': 'paragraph' },
			{ 'children': [{ 'text': 'world' }], 'type': 'paragraph' },
		])
	})
	it('deserializes heading', () => {
		expect(deserializeHtml(`<h1 style='margin-left:71.4pt;mso-list:l4 level1 lfo5'>Lorem ipsum</h1>`, [headingHtmlDeserializer])).toEqual([
			{ 'children': [{ 'text': 'Lorem ipsum' }], 'isNumbered': true, 'level': 1, 'type': 'heading' },
		])
	})
	it('deserializes heading with numbering', () => {
		expect(deserializeHtml(`<h2>Lorem ipsum</h2>`, [headingHtmlDeserializer])).toEqual([
			{ 'children': [{ 'text': 'Lorem ipsum' }], 'isNumbered': false, 'level': 2, 'type': 'heading' },
		])
	})
	it('deserializes anchor', () => {
		expect(deserializeHtml(`<a href="https://google.com">google</a>`, [anchorHtmlDeserializer])).toEqual([
			{ 'children': [{ 'text': 'google' }], 'href': 'https://google.com', 'type': 'anchor' },
		])
	})

	it('deserializes ms word lists', () => {
		expect(deserializeHtml(`
<p class=MsoNormal style='margin-top:6.0pt;margin-right:0cm;margin-bottom:0cm;
margin-left:96.1pt;margin-bottom:.0001pt;text-indent:-24.95pt;mso-list:l0 level2 lfo4;
tab-stops:60.95pt'><![if !supportLists]><span style='mso-list:Ignore'>a)<span
style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span><![endif]>Foo<o:p></o:p></p>

<p class=MsoNormal style='margin-top:6.0pt;margin-right:0cm;margin-bottom:0cm;
margin-left:96.1pt;margin-bottom:.0001pt;text-indent:-24.95pt;mso-list:l0 level2 lfo4;
tab-stops:60.95pt'><![if !supportLists]><span style='mso-list:Ignore'>b)<span
style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span><![endif]>Bar<o:p></o:p></p>

<p class=MsoNormal style='margin-top:6.0pt;margin-right:0cm;margin-bottom:0cm;
margin-left:96.1pt;margin-bottom:.0001pt;text-indent:-24.95pt;mso-list:l0 level2 lfo4;
tab-stops:60.95pt'><![if !supportLists]><span style='mso-list:Ignore'>c)<span
style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span><![endif]>Lorem<o:p></o:p></p>
`, [listHtmlDeserializerFactory()])).toEqual(
			[
				{
					'type': 'orderedList',
					'children': [
						{ 'children': [{ 'text': 'Foo' }], 'type': 'listItem' },
						{ 'children': [{ 'text': 'Bar' }], 'type': 'listItem' },
						{ 'children': [{ 'text': 'Lorem' }], 'type': 'listItem' },
					],
				},
			],
		)
	})


	it('deserializes multiple ms word lists', () => {
		expect(deserializeHtml(`
<p class=MsoListParagraphCxSpFirst style='text-indent:-18.0pt;mso-list:l1 level1 lfo1'><![if !supportLists]><span
style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:
Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]>A<o:p></o:p></p>

<p class=MsoListParagraphCxSpMiddle style='text-indent:-18.0pt;mso-list:l1 level1 lfo1'><![if !supportLists]><span
style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:
Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]>B<o:p></o:p></p>

<p class=MsoListParagraphCxSpMiddle style='text-indent:-18.0pt;mso-list:l1 level1 lfo1'><![if !supportLists]><span
style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:
Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]>C<o:p></o:p></p>

<p class=MsoListParagraphCxSpMiddle style='text-indent:-18.0pt;mso-list:l1 level1 lfo1'><![if !supportLists]><span
style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:
Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]>D<o:p></o:p></p>

<p class=MsoListParagraphCxSpMiddle style='text-indent:-18.0pt;mso-list:l0 level1 lfo2'><![if !supportLists]><span
style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
style='mso-list:Ignore'>1.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]>One<o:p></o:p></p>

<p class=MsoListParagraphCxSpLast style='text-indent:-18.0pt;mso-list:l0 level1 lfo2'><![if !supportLists]><span
style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
style='mso-list:Ignore'>2.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]>Two<o:p></o:p></p>
`, [listHtmlDeserializerFactory()])).toEqual(
			[
				{
					'type': 'unorderedList',
					'children': [
						{ 'children': [{ 'text': 'A' }], 'type': 'listItem' },
						{ 'children': [{ 'text': 'B' }], 'type': 'listItem' },
						{ 'children': [{ 'text': 'C' }], 'type': 'listItem' },
						{ 'children': [{ 'text': 'D' }], 'type': 'listItem' },
					],
				},
				{
					'type': 'orderedList',
					'children': [
						{ 'children': [{ 'text': 'One' }], 'type': 'listItem' },
						{ 'children': [{ 'text': 'Two' }], 'type': 'listItem' },
					],
				},
			],
		)
	})


	it('deserializes ms word list with specifics', () => {
		expect(deserializeHtml(
			`
<p class=lnek1-slo style='margin-top:3.0pt'>Here is a list:<o:p></o:p></p>

<p class=lnek1-slo style='margin-top:3.0pt;margin-right:0cm;margin-bottom:0cm;
margin-left:60.4pt;margin-bottom:.0001pt;text-indent:-17.85pt;mso-list:l0 level2 lfo1'><![if !supportLists]><span
style='mso-list:Ignore'>a)<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;
</span></span><![endif]>first,<o:p></o:p></p>

<p class=lnek1-slo style='margin-top:3.0pt;margin-right:0cm;margin-bottom:0cm;
margin-left:60.4pt;margin-bottom:.0001pt;text-indent:-17.85pt;mso-list:l0 level2 lfo1'><![if !supportLists]><span
style='mso-list:Ignore'>b)<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;
</span></span><![endif]>second and<o:p></o:p></p>

<p class=lnek1-slo style='margin-top:3.0pt;margin-right:0cm;margin-bottom:0cm;
margin-left:60.4pt;margin-bottom:.0001pt;text-indent:-17.85pt;mso-list:l0 level2 lfo1'><![if !supportLists]><span
style='mso-list:Ignore'>c)<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;
</span></span><![endif]>third item.<o:p></o:p></p>
`,
			[
				listHtmlDeserializerFactory({
					getListElementProperties: text => {
						const firstChar = text[0]
						if (firstChar === 'o') {
							return { ordered: false, properties: {} }
						}
						return {
							ordered: true,
							properties: text.match(/^\d$/) === null ? { numbering: 'official' } : {},
						}
					},
				}),
			],
		)).toEqual(
			[
				{ 'children': [{ 'text': 'Here is a list:' }, { 'text': ' ' }], 'type': 'paragraph' }, // TODO: The space should be removed
				{
					'type': 'orderedList',
					'numbering': 'official',
					'children': [
						{ 'children': [{ 'text': 'first,' }], 'type': 'listItem' },
						{ 'children': [{ 'text': 'second and' }], 'type': 'listItem' },
						{ 'children': [{ 'text': 'third item.' }], 'type': 'listItem' },
					],
				},
			],
		)
	})
})
