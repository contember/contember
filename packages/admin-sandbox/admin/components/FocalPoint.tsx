import {
	AccessorTree,
	Button,
	Component,
	Entity,
	Field,
	Radio,
	Stack,
	SugarableRelativeSingleField,
	useAccessorTreeState,
	useDialog,
	useEntity,
	useField,
} from '@contember/admin'
import { CSSProperties, Fragment, useCallback, useMemo, useState } from 'react'


type PointConfig = {
	xField: string | SugarableRelativeSingleField
	yField: string | SugarableRelativeSingleField
	label?: string
	color?: CSSProperties['background']
	size?: CSSProperties['width']

}

type PreviewConfig = {
	width: number
	height: number
	label?: string
	pointPriority?: number[]
}

interface FocalPointEditorProps {
	urlField: string | SugarableRelativeSingleField
	points: PointConfig[]
	previews?: PreviewConfig[]
}

const colors = ['red', 'green', 'blue', 'orange']
const FocalPointMarker = ({ point, index }: {
	point: PointConfig,
	index: number
}) => {
	const xField = useField<number>(point.xField).value
	const yField = useField<number>(point.yField).value
	const color = point.color ?? colors[index % colors.length]
	if (xField === null || yField === null) {
		return null
	}

	return (
		<div style={{
			position: 'absolute',
			background: color,
			width: '8px',
			height: '8px',
			borderRadius: '50%',
			transform: 'translate(-50%, -50%)',
			left: (xField * 100) + '%',
			top: (yField * 100) + '%',
		}}>&nbsp;</div>
	)
}

const ImagePreview = ({ url, focalPoint, preview }: { url: string, focalPoint?: [number, number], preview: PreviewConfig }) => {

	return (
		<>
			<h2>{preview.label}</h2>
			{focalPoint ? <div style={{
				backgroundImage: `url("${url}")`,
				width: preview.width + 'px',
				height: preview.height + 'px',
				backgroundSize: 'cover',
				backgroundPosition: `${(focalPoint?.[0] ?? 0) * 100}% ${(focalPoint?.[1] ?? 0) * 100}%`,
			}} /> : <>No focal point</>}
		</>
	)
}

const FocalPointEditor = Component<FocalPointEditorProps>(({ points, urlField, previews }) => {
	const entity = useEntity()
	const [activePoint, setActivePoint] = useState(0)
	const urlFieldAccessor = useField<string>(urlField)
	const url = urlFieldAccessor.value

	const handleClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
		const point = points[activePoint]
		const x = e.nativeEvent.offsetX / e.currentTarget.offsetWidth
		const y = e.nativeEvent.offsetY / e.currentTarget.offsetHeight
		entity.getField(point.xField).updateValue(x)
		entity.getField(point.yField).updateValue(y)
	}, [activePoint, entity, points])

	const resolvedFocalPoints = useMemo(() => points.map((it): [number, number] | undefined => {
		const xField = entity.getField<number>(it.xField).value
		const yField = entity.getField<number>(it.yField).value
		return xField !== null && yField !== null ? [xField, yField] : undefined
	}), [entity, points])

	const radioOptions = points.map((it, index) => ({
		label: it.label ?? `Point #${index + 1}`,
		value: String(index),
	}))

	if (!url) {
		return null
	}

	return <>
		<Stack horizontal>
			<Stack>
				{points.length > 1 && (
					<Radio
						options={radioOptions}
						value={String(activePoint)}
						onChange={it => setActivePoint(parseInt(it, 10))}
					/>
				)}
				<div style={{ position: 'relative' }}>
					<img src={url} style={{ maxWidth: '100%', display: 'block' }} onClick={handleClick} />
					{points.map((it, index) => <FocalPointMarker point={it} index={index} key={index} />)}
				</div>
			</Stack>
			<Stack>
				{previews?.map((it, index) => {
					let resolvedPoint: [number, number] | undefined = undefined
					for (const point of it.pointPriority ?? [0]) {
						resolvedPoint = resolvedFocalPoints[point] ?? undefined
						if (resolvedPoint !== undefined) {
							break
						}
					}
					return <ImagePreview key={index} url={url} preview={it} focalPoint={resolvedPoint} />
				})}
			</Stack>
		</Stack>
	</>
}, props => {
	return <>{props.points.map((it, i) => (<Fragment key={i}>
		<Field field={it.xField} />
		<Field field={it.yField} />
	</Fragment>))}</>
})

export const FocalPointDialogOpener = Component<FocalPointEditorProps>(props => {
	const dialog = useDialog()
	const entity = useEntity()
	const accessorTreeState = useAccessorTreeState()
	const openDialog = useCallback(async () => {
		await dialog.openDialog({
			footer: ({ resolve }) => <Button onClick={() => resolve()}>Ok</Button>,
			content: () => {
				return (
					<AccessorTree state={accessorTreeState}>
						<Entity accessor={entity}><FocalPointEditor {...props} /></Entity>
					</AccessorTree>
				)
			},
		})
	}, [accessorTreeState, dialog, entity, props])

	return <Button onClick={openDialog}>Edit focal point</Button>
}, props => <FocalPointEditor {...props} />)
