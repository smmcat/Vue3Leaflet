import * as L from 'leaflet';

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

// 在您的 types/map.ts 中应更新为：
export interface MarkerClickEvent {
    marker: MapMarker;
    position: LatLngTuple;
    zoom?: number;               // 新增
    mapState?: {                 // 新增
        zoom: number;
        center: L.LatLng;
        bounds: L.LatLngBounds;
    };
    originalEvent: L.LeafletEvent;
}


export type LatLngTuple = [number, number]

