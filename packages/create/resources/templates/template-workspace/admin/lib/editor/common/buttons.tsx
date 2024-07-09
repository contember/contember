import {
	anchorElementType,
	boldMark,
	codeMark,
	createAlignHandler,
	EditorElementTrigger,
	EditorGenericTrigger,
	EditorMarkTrigger,
	headingElementType,
	highlightMark,
	horizontalRuleElementType,
	italicMark,
	orderedListElementType,
	paragraphElementType,
	scrollTargetElementType,
	strikeThroughMark,
	tableElementType,
	underlineMark,
	unorderedListElementType,
} from '@contember/react-slate-editor-base'
import * as React from 'react'
import { ReactNode } from 'react'
import { Toggle } from '../../ui/toggle'
import {
	AlignCenterIcon,
	AlignJustifyIcon,
	AlignLeftIcon,
	AlignRightIcon,
	BoldIcon,
	CodeIcon,
	HashIcon,
	Heading1Icon,
	Heading2Icon,
	Heading3Icon,
	Heading4Icon,
	Heading5Icon,
	Heading6Icon,
	HighlighterIcon,
	ItalicIcon,
	LinkIcon,
	ListIcon,
	ListOrderedIcon,
	LocateIcon,
	MinusIcon,
	PilcrowIcon,
	StrikethroughIcon,
	TableIcon,
	UnderlineIcon,
} from 'lucide-react'


export const editorButtons: ReactNode = <>
	<EditorMarkTrigger mark={boldMark}><Toggle><BoldIcon className="h-3 w-3" /></Toggle></EditorMarkTrigger>
	<EditorMarkTrigger mark={italicMark}><Toggle><ItalicIcon className="h-3 w-3" /></Toggle></EditorMarkTrigger>
	<EditorMarkTrigger mark={underlineMark}><Toggle><UnderlineIcon className="h-3 w-3" /></Toggle></EditorMarkTrigger>
	<EditorMarkTrigger mark={strikeThroughMark}><Toggle><StrikethroughIcon className="h-3 w-3" /></Toggle></EditorMarkTrigger>
	<EditorMarkTrigger mark={highlightMark}><Toggle><HighlighterIcon className="h-3 w-3" /></Toggle></EditorMarkTrigger>
	<EditorMarkTrigger mark={codeMark}><Toggle><CodeIcon className="h-3 w-3" /></Toggle></EditorMarkTrigger>
	<EditorElementTrigger elementType={anchorElementType}><Toggle><LinkIcon className="h-3 w-3" /></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={headingElementType} suchThat={{ level: 1, isNumbered: false }}><Toggle><Heading1Icon className="h-3 w-3" /></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={headingElementType} suchThat={{ level: 1, isNumbered: true }}><Toggle className="relative"><Heading1Icon className="h-3 w-3" /> <HashIcon className="h-2.5 w-2.5 absolute right-2 top-1"/></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={headingElementType} suchThat={{ level: 2, isNumbered: false }}><Toggle><Heading2Icon className="h-3 w-3" /></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={headingElementType} suchThat={{ level: 2, isNumbered: true }}><Toggle className="relative"><Heading2Icon className="h-3 w-3" /> <HashIcon className="h-2.5 w-2.5 absolute right-2 top-1"/></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={headingElementType} suchThat={{ level: 3, isNumbered: false }}><Toggle><Heading3Icon className="h-3 w-3" /></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={headingElementType} suchThat={{ level: 3, isNumbered: true }}><Toggle className="relative"><Heading3Icon className="h-3 w-3" /> <HashIcon className="h-2.5 w-2.5 absolute right-2 top-1"/></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={headingElementType} suchThat={{ level: 4, isNumbered: false }}><Toggle><Heading4Icon className="h-3 w-3" /></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={headingElementType} suchThat={{ level: 4, isNumbered: true }}><Toggle className="relative"><Heading4Icon className="h-3 w-3" /> <HashIcon className="h-2.5 w-2.5 absolute right-2 top-1" /></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={headingElementType} suchThat={{ level: 5, isNumbered: false }}><Toggle><Heading5Icon className="h-3 w-3" /></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={headingElementType} suchThat={{ level: 5, isNumbered: true }}><Toggle className="relative"><Heading5Icon className="h-3 w-3" /> <HashIcon className="h-2.5 w-2.5 absolute right-2 top-1" /></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={headingElementType} suchThat={{ level: 6, isNumbered: false }}><Toggle><Heading6Icon className="h-3 w-3" /></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={headingElementType} suchThat={{ level: 6, isNumbered: true }}><Toggle className="relative"><Heading6Icon className="h-3 w-3" /><HashIcon className="h-2.5 w-2.5 absolute right-2 top-1" /></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={horizontalRuleElementType} ><Toggle><MinusIcon className="h-3 w-3" /></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={unorderedListElementType} ><Toggle><ListIcon className="h-3 w-3" /></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={orderedListElementType} ><Toggle><ListOrderedIcon className="h-3 w-3" /></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={scrollTargetElementType} ><Toggle><LocateIcon className="h-3 w-3" /></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={paragraphElementType} suchThat={{ isNumbered: false }} ><Toggle><PilcrowIcon className="h-3 w-3" /></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={paragraphElementType} suchThat={{ isNumbered: true }} ><Toggle className="relative"><PilcrowIcon className="h-3 w-3" /> <HashIcon className="h-2.5 w-2.5 absolute right-2 top-1" /></Toggle></EditorElementTrigger>
	<EditorElementTrigger elementType={tableElementType}  ><Toggle><TableIcon className="h-3 w-3" /> </Toggle></EditorElementTrigger>
	<EditorGenericTrigger {...createAlignHandler('start')}><Toggle><AlignLeftIcon className="h-3 w-3" /></Toggle></EditorGenericTrigger>
	<EditorGenericTrigger {...createAlignHandler('end')}><Toggle><AlignRightIcon className="h-3 w-3" /></Toggle></EditorGenericTrigger>
	<EditorGenericTrigger {...createAlignHandler('center')}><Toggle><AlignCenterIcon className="h-3 w-3" /></Toggle></EditorGenericTrigger>
	<EditorGenericTrigger {...createAlignHandler('justify')}><Toggle><AlignJustifyIcon className="h-3 w-3" /></Toggle></EditorGenericTrigger>
</>
