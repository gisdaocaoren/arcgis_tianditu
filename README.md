# arcgis_tianditu
一个基于ArcGIS JavaScript API的扩展包，可以加载不同类型，不同空间参考的天地图，并解决了直接扩展天地图产生的偏移问题
## [在线访问](http://gisdaocaoren.github.io/arcgis_tianditu/)
使用方法：
var layer = new TianDiTuLayer(TianDiTuLayer.VEC_BASE_GCS);   //底图图层
var ano_layer = new TianDiTuLayer(TianDiTuLayer.VEC_ANNO_GCS);   //中文注记图层
map.addLayer(layer);
map.addLayer(ano_layer);

参数说明
* 天地图类型：TianDiTuLayer.XXXX，其中XXXX有以下值：
* VEC_BASE_GCS: 矢量底图(经纬度坐标系)
* VEC_ANNO_GCS: 矢量注记图层(经纬度坐标系)
* VEC_ANNO_GCS_EN: 矢量注记图层(经纬度坐标系)-英文注记

* VEC_BASE_WEBMERCATOR ：矢量底图(web墨卡托)
* VEC_ANNO_WEBMERCATOR： 矢量注记图层((web墨卡托)
* VEC_ANNO_WEBMERCATOR_EN： 矢量注记图层((web墨卡托)-英文注记
*
* IMG_BASE_GCS: 影像底图(经纬度坐标系)
* IMG_ANNO_GCS: 影像注记图层(经纬度坐标系)
* IMG_ANNO_GCS_EN: 影像注记图层(经纬度坐标系) -英文注记

* IMG_BASE_WEBMERCATOR ：影像底图(web墨卡托)
* IMG_ANNO_WEBMERCATOR： 影像注记图层((web墨卡托)
* IMG_ANNO_WEBMERCATOR_EN： 影像注记图层((web墨卡托)-英文注记
*
* TER_BASE_GCS: 地形底图(经纬度坐标系)
* TER_ANNO_GCS: 地形注记图层(经纬度坐标系)
* TER_BASE_WEBMERCATOR ：地形底图(web墨卡托)
* TER_ANNO_WEBMERCATOR： 地形注记图层((web墨卡托)

![image](https://raw.githubusercontent.com/gisdaocaoren/arcgis_tianditu/master/screenshots/4.gif)             
![image](https://raw.githubusercontent.com/gisdaocaoren/arcgis_tianditu/master/screenshots/1.png)
![image](https://raw.githubusercontent.com/gisdaocaoren/arcgis_tianditu/master/screenshots/2.png)
![image](https://raw.githubusercontent.com/gisdaocaoren/arcgis_tianditu/master/screenshots/3.png)
