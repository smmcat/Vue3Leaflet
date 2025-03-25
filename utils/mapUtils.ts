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
    // 可扩展其他字段
    [key: string]: any;
}

export const useMap = () => {
    let mapInstance: Map | null = null;
    const markers: Marker[] = [];
    let markerClickCallback: ((event: MarkerClickEvent) => void) | null = null;

    // 添加标记点击回调配置方法（带类型提示）
    const onMarkerClick = (callback: (event: MarkerClickEvent) => void) => {
        markerClickCallback = callback;
    };

    // 获取当前地图状态
    const getCurrentMapState = () => {
        if (!mapInstance) return null;
        return {
            center: mapInstance.getCenter(),
            zoom: mapInstance.getZoom(),
            bounds: mapInstance.getBounds()
        };
    };

    // 初始化地图（增加返回值类型）
    const initMap = (
        container: HTMLElement | string,
        center: LatLngExpression = [35.738861, 104.065735],
        zoom = 4
    ): Map => {
        initLeafletIcons();

        mapInstance = L.map(container, {
            preferCanvas: true, // 提升大量标记时的性能
            zoomControl: true   // 显示缩放控件
        }).setView(center, zoom);

        // 使用高德地图瓦片（增加错误处理）
        L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
            subdomains: ['1', '2', '3', '4'],
            attribution: '© <a href="https://ditu.amap.com/">高德地图</a>'
        }).addTo(mapInstance);

        return mapInstance;
    };

    // 添加标记点（优化事件处理）
    const addMarkers = (markersData: MapMarker[], customIcon?: Icon) => {
        if (!mapInstance) throw new Error('Map not initialized');
        clearMarkers();

        markersData.forEach(markerData => {
            const marker = L.marker([markerData.lat, markerData.lng], {
                icon: customIcon || L.icon({
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34]
                }),
                title: markerData.name // 增加悬停提示
            });

            // 优化弹窗内容
            marker.bindPopup(`
                <div class="map-popup">
                    <h3>${markerData.name}</h3>
                    <p>${markerData.info}</p>
                </div>
            `, {
                maxWidth: 300,
                minWidth: 100
            });

            // 增强点击事件
            marker.on('click', (e: L.LeafletEvent) => {
                const currentZoom = mapInstance?.getZoom();
                const currentCenter = mapInstance?.getCenter();

                if (markerClickCallback) {
                    markerClickCallback({
                        marker: markerData,
                        originalEvent: e,
                        position: [markerData.lat, markerData.lng],
                        zoom: currentZoom,  // 新增当前缩放级别
                        mapState: {         // 新增完整地图状态
                            zoom: currentZoom!,
                            center: currentCenter!,
                            bounds: mapInstance!.getBounds()
                        }
                    });
                }
            });

            markers.push(marker.addTo(mapInstance!));
        });
    };

    // 清除所有标记（增加返回值）
    const clearMarkers = (): number => {
        const count = markers.length;
        markers.forEach(marker => marker.remove());
        markers.length = 0;
        return count;
    };

    // 飞行到指定位置（优化动画参数）
    const flyToLocation = (
        latlng: L.LatLngExpression,
        zoom?: number,
        options: L.ZoomPanOptions = {
            duration: 0.5,
            easeLinearity: 0.25
        }
    ) => {
        if (mapInstance) {
            if (zoom !== undefined) {
                mapInstance.flyTo(latlng, zoom, options);
            } else {
                mapInstance.flyTo(latlng, mapInstance.getZoom(), options);
            }
        }
    };

    return {
        map: mapInstance,
        initMap,
        addMarkers,
        clearMarkers,
        destroyMap: () => {
            clearMarkers();
            mapInstance?.remove();
            mapInstance = null;
        },
        resetMap: (container: HTMLElement | string, center: L.LatLngExpression, zoom: number) => {
            if (mapInstance) {
                mapInstance.remove();
                mapInstance = null;
            }
            return initMap(container, center, zoom);
        },
        flyToLocation,
        onMarkerClick,
        getCurrentMapState, // 新增方法
        L
    };
};
