import type { MarkerClickEvent } from '@/types/map';
import L, { Map, Marker, Icon, type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 修复 Leaflet 默认图标路径问题
const initLeafletIcons = () => {
    delete (Icon.Default.prototype as any)._getIconUrl;
    Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
};

interface MapMarker {
    lat: number;
    lng: number;
    name: string;
    info: string;
}

export const useMap = () => {
    let mapInstance: Map | null = null;
    const markers: Marker[] = [];
    let markerClickCallback: ((event: MarkerClickEvent) => void) | null = null

    // 添加标记点击回调配置方法
    const onMarkerClick = (callback: (event: MarkerClickEvent) => void) => {
        markerClickCallback = callback
    }

    // 重置
    const resetMap = (container: HTMLElement | string, center: L.LatLngExpression, zoom: number) => {
        if (mapInstance) {
            mapInstance.remove();
            mapInstance = null;
        }
        return initMap(container, center, zoom);
    };

    // 初始化地图
    const initMap = (container: HTMLElement | string, center: LatLngExpression = [35.738861, 104.065735], zoom = 4): Map => {
        initLeafletIcons();

        mapInstance = L.map(container, {
            preferCanvas: true, // 提升大量标记时的性能
        }).setView(center, zoom);

        // 使用高德地图瓦片
        L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
            subdomains: ['1', '2', '3', '4'],
            attribution: ''
        }).addTo(mapInstance);

        return mapInstance;
    };

    // 添加标记点
    const addMarkers = (markersData: MapMarker[], customIcon?: Icon) => {
        if (!mapInstance) throw new Error('Map not initialized')
        clearMarkers()

        markersData.forEach(markerData => {
            const newMarker = L.marker([markerData.lat, markerData.lng], {
                icon: customIcon || L.icon({
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                })
            })
                .bindPopup(`
        <div class="map-popup">
          <h3>${markerData.name}</h3>
          <p>${markerData.info}</p>
        </div>
      `)
            // 添加点击事件监听
            newMarker.on('click', (e: L.LeafletEvent) => {
                if (markerClickCallback) {
                    markerClickCallback({
                        marker: markerData,
                        originalEvent: e,
                        position: [markerData.lat, markerData.lng]
                    })
                }
            })

            markers.push(newMarker.addTo(mapInstance!))
        })
    }





    // 清除所有标记
    const clearMarkers = () => {
        markers.forEach(marker => marker.remove());
        markers.length = 0;
    };

    // 销毁地图
    const destroyMap = () => {
        clearMarkers();
        mapInstance?.remove();
        mapInstance = null;
    };

    const flyToLocation = (latlng: L.LatLngExpression, zoom: number) => {
        if (mapInstance) {
            mapInstance.flyTo(latlng, zoom, {
                duration: 1,  // 动画持续时间(秒)
                easeLinearity: 0.25
            });
        }
    };
    return {
        map: mapInstance,
        initMap,
        addMarkers,
        clearMarkers,
        destroyMap,
        resetMap,
        flyToLocation,
        onMarkerClick,
        L
    };
};
