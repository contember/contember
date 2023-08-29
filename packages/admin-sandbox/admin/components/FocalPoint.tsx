import {
	AccessorTree,
	Box,
	Button,
	Component,
	Description,
	Entity,
	Field,
	Heading,
	Radio,
	Spacer,
	Stack,
	SugarableRelativeSingleField,
	Text,
	useAccessorTreeState,
	useDialog,
	useEntity,
	useField,
} from '@contember/admin'
import { ResponsiveStack } from '@contember/layout'
import { useClassName, useElementSize } from '@contember/react-utils'
import { px } from '@contember/utilities'
import { CSSProperties, Fragment, useCallback, useMemo, useRef, useState } from 'react'
import './FocalPoint.css'

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
	const className = useClassName('focal-point-marker')

	if (xField === null || yField === null) {
		return null
	}

	return (
		<div
			className={className}
			style={{
				background: color,
				left: (xField * 100) + '%',
				top: (yField * 100) + '%',
			}}
		/>
	)
}

const ImagePreview = ({ url, focalPoint, preview }: { url: string, focalPoint?: [number, number], preview: PreviewConfig }) => {

	return (
		<Box border={false} padding={false} style={{ width: 'unset' }}>
			<Heading depth={2} style={{ fontSize: '1rem' }}>{preview.label}</Heading>
			<div className={useClassName('focal-point-photo-holder')}>
				{focalPoint
					? (
						<div
							style={{
								backgroundImage: `url("${url}")`,
								width: preview.width + 'px',
								height: preview.height + 'px',
								backgroundSize: 'cover',
								backgroundPosition: `${(focalPoint?.[0] ?? 0) * 100}% ${(focalPoint?.[1] ?? 0) * 100}%`,
							}}
						/>
					)
					: (
						<Box
							background={false}
							padding="gutter"
							border={false}
						>
							<Description>No focal point</Description>
						</Box>
					)}
			</div>
		</Box>
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
		<ResponsiveStack
			horizontal={width => width > 768 ? true : false}
			className={useClassName('focal-point-editor')}
		>
			<Stack className={useClassName('focal-point-editor-body')}>
				{points.length > 1 && (
					<Radio
						orientation="horizontal"
						options={radioOptions}
						value={String(activePoint)}
						onChange={it => setActivePoint(parseInt(it, 10))}
					/>
				)}
				<div className={useClassName(['focal-point-editor-photo', 'focal-point-photo-holder'])}>
					<div className={useClassName('focal-point-editor-photo-img-wrapper')}>
						<img src={url} onClick={handleClick} />
						{points.map((it, index) => <FocalPointMarker point={it} index={index} key={index} />)}
					</div>
				</div>
			</Stack>
			<ResponsiveStack
				horizontal={width => width > 768 ? false : true}
				className={useClassName('focal-point-editor-previews')}
				wrap={width => width > 768 ? false : true}
			>
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
			</ResponsiveStack>
		</ResponsiveStack>
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
			footer: ({ resolve }) => <><Spacer grow /><Button onClick={() => resolve()}>Done</Button></>,
			content: () => {
				return (
					<AccessorTree state={accessorTreeState}>
						<Entity accessor={entity}><FocalPointEditor {...props} /></Entity>
					</AccessorTree>
				)
			},
		})
	}, [accessorTreeState, dialog, entity, props])

	return <Button distinction="seamless" inset={false} onClick={openDialog}>Edit focal point</Button>
}, props => <FocalPointEditor {...props} />)
