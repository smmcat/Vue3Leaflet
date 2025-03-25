export interface MapMarker {
    lat: number
    lng: number
    name: string
    info: string
}

export interface DistrictOption {
    id: string | number
    name: string
    position: LatLngTuple
    zoom?: number
    markers?: MapMarker[]
}

export interface MarkerClickEvent {
    marker: MapMarker
    originalEvent: L.LeafletEvent
    position: [number, number]
}

export type LatLngTuple = [number, number]

