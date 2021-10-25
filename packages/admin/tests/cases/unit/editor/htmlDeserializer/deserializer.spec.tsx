import { deserializeHtml } from './utils'
import {
	anchorHtmlDeserializer,
	headingHtmlDeserializer,
	listHtmlDeserializer,
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
`, [listHtmlDeserializer])).toEqual(
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
})
