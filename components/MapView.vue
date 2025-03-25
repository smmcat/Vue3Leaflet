<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useMap } from '@/utils/mapUtils'
import type { LatLngExpression } from 'leaflet'
import type { MapMarker, MarkerClickEvent } from '@/types/map'

// 定义市区选项类型
interface DistrictOption {
  id: string | number
  name: string
  position: LatLngExpression
  zoom?: number
  markers?: MapMarker[] // 添加关联标记点
}

const props = defineProps({
  center: {
    type: Array as unknown as () => LatLngExpression,
    default: () => [35.738861, 104.065735]
  },
  zoom: {
    type: Number,
    default: 4
  },
  markers: {
    type: Array as () => MapMarker[],
    default: () => []
  },
  selectedDistrict: {
    type: Object as () => DistrictOption | null,
    default: null
  }
})

const emit = defineEmits<{
  (e: 'marker-click', event: MarkerClickEvent): void
}>()

const mapContainer = ref<HTMLElement>()
const { initMap, addMarkers, destroyMap, flyToLocation, onMarkerClick } = useMap()

// 初始化地图
onMounted(() => {
  if (mapContainer.value) {
    initMap(mapContainer.value, props.center, props.zoom)
    
    // 设置标记点击回调
    onMarkerClick((event) => {
      emit('marker-click', event)
    })
    
    // 添加初始标记
    addMarkers(props.markers)

    // 初始市区聚焦
    if (props.selectedDistrict) {
      handleDistrictFocus(props.selectedDistrict)
    }
  }
})

// 处理市区聚焦逻辑
const handleDistrictFocus = (district: DistrictOption) => {
  flyToLocation(district.position, district.zoom || 12)
  
  // 合并市区关联标记和组件传入的标记
  const combinedMarkers = [
    ...(district.markers || []),
    ...props.markers
  ]
  addMarkers(combinedMarkers)
}

// 监听市区选择变化
watch(
  () => props.selectedDistrict,
  (newDistrict) => {
    if (newDistrict) {
      handleDistrictFocus(newDistrict)
    }
  },
  { deep: true }
)

// 响应式更新标记
watch(() => props.markers, (newMarkers) => {
  addMarkers(newMarkers)
}, { deep: true })

// 响应式更新中心点和缩放级别
watch(() => [props.center, props.zoom], ([newCenter, newZoom]) => {
  if (newCenter && newZoom) {
    flyToLocation(newCenter as LatLngExpression, newZoom as number)
  }
})

// 清理资源
onUnmounted(() => {
  destroyMap()
})
</script>

<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<style scoped>
.map-container {
  height: 100%;
  width: 100%;
  min-height: 300px;
  background: #f0f0f0;
}

/* 全局样式需要放在非scoped的style中 */
:global(.custom-popup) {
  font-family: 'Arial', sans-serif;
}

:global(.custom-popup h3) {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #333;
}

:global(.custom-popup p) {
  margin: 0;
  font-size: 14px;
  color: #666;
}
</style>
