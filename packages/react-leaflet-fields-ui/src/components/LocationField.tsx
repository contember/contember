import { Component, SugaredField, SugaredFieldProps, useField } from '@contember/react-binding'
import { FieldContainer, FieldContainerProps } from '@contember/ui'
import * as Leaflet from 'leaflet'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import {
	MapContainer as Map,
	MapContainerProps as MapProps,
	Marker,
	MarkerProps,
	TileLayer,
	TileLayerProps,
} from 'react-leaflet'

export interface LocationFieldProps extends Omit<FieldContainerProps, 'children'> {
	latitudeField: SugaredFieldProps['field']
	longitudeField: SugaredFieldProps['field']
	mapCenter?: [number, number]
	zoom?: number
	tileLayerProps?: Partial<TileLayerProps>
	mapProps?: MapProps
	markerProps?: MarkerProps
}

const markerIcon = Leaflet.divIcon({
	className: 'locationField-marker',
	iconSize: [24, 24],
	iconAnchor: [12, 23],
})

const defaultZoom = 5

/**
 * @group Form Fields
 */
export const LocationField: FunctionComponent<LocationFieldProps> = Component(
	({
		latitudeField,
		longitudeField,
		mapCenter,
		zoom = defaultZoom,
		tileLayerProps,
		mapProps,
		markerProps,
		...fieldContainerProps
	}) => {
		const latitude = useField<number>(latitudeField)
		const longitude = useField<number>(longitudeField)

		const moveMarker = useCallback((e: { latlng?: Leaflet.LatLng }) => {
			const latLng = e.latlng
			if (latLng === undefined) {
				return
			}
			latitude.updateValue(latLng.lat)
			longitude.updateValue(latLng.lng)
		}, [latitude, longitude])

		const [resolvedCenter] = useState((): [number, number] => {
			if (mapCenter !== undefined) {
				return mapCenter
			}
			if (latitude.value !== null && longitude.value !== null) {
				return [latitude.value, longitude.value]
			}
			return [50.102223, 9.254419] // Center of Europe.
		})
		const [map, setMap] = useState<Leaflet.Map | null>(null)
		useEffect(() => {
			map?.on('click', moveMarker)
			return () => {
				map?.off('click', moveMarker)
			}
		}, [map, moveMarker])

		return (
			<FieldContainer {...fieldContainerProps}>
				<div className="locationField-map-container">
					<Map
						ref={setMap}
						center={resolvedCenter}
						zoom={zoom}
						className="locationField-map-canvas"
						{...(mapProps ?? {})}
					>
						<TileLayer
							url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
							attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
							{...(tileLayerProps ?? {})}
						/>
						{latitude.value !== null && longitude.value !== null && (
							<Marker
								icon={markerIcon}
								{...(markerProps ?? {})}
								position={[latitude.value, longitude.value]}
								draggable
								eventHandlers={{
									move: moveMarker as any,
								}}
							/>
						)}
					</Map>
				</div>
			</FieldContainer>
		)
	},
	props => (
		<>
			<SugaredField field={props.latitudeField} />
			<SugaredField field={props.longitudeField} />
		</>
	),
	'LocationField',
)
