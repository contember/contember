import { Component, Field, SugarableRelativeSingleField, useField } from '@contember/interface'
import { cn } from '@udecode/cn'
import { normalizeInitialValue, Plate, replaceNodeChildren, useEditorRef } from '@udecode/plate-common'
import { useEffect, useRef } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { plugins } from './plate-plugins'
import { Editor } from './plate-ui/editor'
import { FixedToolbar } from './plate-ui/fixed-toolbar'
import { FixedToolbarButtons } from './plate-ui/fixed-toolbar-buttons'
import { FloatingToolbar } from './plate-ui/floating-toolbar'
import { FloatingToolbarButtons } from './plate-ui/floating-toolbar-buttons'
import { TooltipProvider } from './plate-ui/tooltip'
import { isJsonContent, isJsonObject } from './utils'


export interface PlateEditorProps {
	field: string | SugarableRelativeSingleField
}

export const PlateEditor = Component(
	({ field }: PlateEditorProps) => {
		const containerRef = useRef(null)
		const contentField = useField(field)

		const handleEditorOnChange = (value: any) => {
			const contentJson = isJsonObject(value) ? { children: value } : null

			if (contentJson && contentField.value && (isJsonContent(contentField.value) && contentField.value.children === value)) {
				return
			}

			contentField.updateValue(contentJson)
		}

		return (
			<DndProvider backend={HTML5Backend}>
				<TooltipProvider>
					<Plate
						plugins={plugins}
						value={isJsonContent(contentField?.value) ? contentField?.value?.children : undefined}
						onChange={handleEditorOnChange}
						normalizeInitialValue
					>
						<PlateContentSync field={field} />
						<div
							ref={containerRef}
							className={cn(
								'relative',
								'border rounded-md',
								'[&_.slate-start-area-left]:!w-[64px] [&_.slate-start-area-right]:!w-[64px] [&_.slate-start-area-top]:!h-4',
							)}
						>

							<div className={'relative'}>
								<FixedToolbar>
									<FixedToolbarButtons/>
								</FixedToolbar>

								<Editor
									className="px-[96px] py-16"
									autoFocus
									focusRing={false}
									variant="ghost"
									size="md"
								/>

								<FloatingToolbar>
									<FloatingToolbarButtons/>
								</FloatingToolbar>
							</div>
						</div>
					</Plate>
				</TooltipProvider>
			</DndProvider>
		)
	},
	({ field }) => (
		<>
			<Field field={field}/>
		</>
	),
	'PlateEditor',
)

interface PlateContentSyncProps {
	field: string | SugarableRelativeSingleField
}

const PlateContentSync = ({ field }: PlateContentSyncProps) => {
	const contentField = useField(field)
	const fieldAccessor = contentField.getAccessor
	const fieldValue = contentField.value
	const editor = useEditorRef()

	useEffect(() => {
		if (fieldValue !== fieldAccessor().value) {
			return
		}
		const currValue = isJsonContent(fieldValue) && fieldValue.children.length > 0
			? fieldValue.children
			: editor.childrenFactory()
		if (currValue === editor.children) {
			return
		}
		const normalizedValue = normalizeInitialValue(editor, currValue) ?? currValue
		replaceNodeChildren(editor, {
			at: [],
			nodes: normalizedValue,
		} as any)
	}, [editor, fieldAccessor, fieldValue])

	return null
}
