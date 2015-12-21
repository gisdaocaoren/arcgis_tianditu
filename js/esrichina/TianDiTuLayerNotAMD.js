dojo._hasResource["esri.layers.wmts"] = true;
dojo.provide("esrichina.wmts");

dojo.require("esri.layers.tiled");
dojo.require("esri.layers.agscommon");
dojo.require("esri.WKIDUnitConversion");
dojo.require("dojox.xml.parser");


dojo.declare("esrichina.TianDiTuLayer", [esri.layers.TiledMapServiceLayer], {
  copyright: null,
  extent: null,
  tileUrl: null,
  layerInfo: null,
  spatialReference: null,
  tileInfo: null,
  constructor: function (type,url, options) {
  	 
    this.version = "1.0.0";
    // this.tileUr = this._url = url;
    this.tileUr = this._url = "http://t0.tianditu.com/" + type +"/wmts";
    this.serviceMode = "RESTful";
    this._parseCapabilities = dojo.hitch(this, this._parseCapabilities);
    this._getCapabilitiesError = dojo.hitch(this, this._getCapabilitiesError);
    if (!options) {
      options = {};
    }
    //Modified by Zhangn
    this.options = options;
    if (options.serviceMode) {
      if (options.serviceMode === "KVP" || options.serviceMode === "RESTful") {
        this.serviceMode = options.serviceMode;
      } else {
        console.error("WMTS mode could only be 'KVP' or 'RESTful'");
        return;
      }
    }
    
     this.serviceMode = "KVP";
    
    if (options.layerInfo ) {
      this.layerInfo = options.layerInfo;
      this._identifier = options.layerInfo.identifier;
      this._tileMatrixSetId = options.layerInfo.tileMatrixSet;
      this.format = "image/" + options.layerInfo.format;
      this._style = options.layerInfo.style;
      this.title = options.layerInfo.title;
    }

    if (options.resourceInfo) {
      this.version = options.resourceInfo.version;
      if (options.resourceInfo.getTileUrl) {
        this._url = this.tileUrl = options.resourceInfo.getTileUrl;
      }
      this.copyright = options.resourceInfo.copyright;
      this.layerInfos = options.resourceInfo.layerInfos;
      this._parseResourceInfo();
      this.loaded = true;
      this.onLoad(this);
    } else {
      this._getCapabilities();
    }

    this._formatDictionary = {
      "image/png": ".png",
      "image/png8": ".png",
      "image/png24": ".png",
      "image/png32": ".png",
      "image/jpg": ".jpg",
      "image/jpeg": ".jpg",
      "image/gif": ".gif",
      "image/bmp": ".bmp",
      "image/tiff": ".tif"
    };
  },

  setActiveLayer: function (layerInfo) {
    this.layerInfo = layerInfo;
    this._identifier = layerInfo.identifier;
    this._tileMatrixSetId = layerInfo.tileMatrixSet;
    if (layerInfo.format) {
      this.format = "image/" + layerInfo.format;
    }
    this._style = layerInfo.style;
    this.title = layerInfo.title;
    this._parseResourceInfo();
    this.refresh(true);
  },

  getTileUrl: function (level, row, col) {
    var tileUrl; 
    if (this.serviceMode === "KVP") {
      tileUrl = this._url + "SERVICE=WMTS&VERSION=" + this.version + "&REQUEST=GetTile" + "&LAYER=" + this._identifier + "&STYLE=" + this._style + "&FORMAT=" + this.format + "&TILEMATRIXSET=" + this._tileMatrixSetId + "&TILEMATRIX=" + level + "&TILEROW=" + row + "&TILECOL=" + col;
    } else if (this.serviceMode === "RESTful") {
      var imagePostfix;
      if (this._formatDictionary[this.format]) {
        imagePostfix = this._formatDictionary[this.format];
      }
      tileUrl = this._url + this._identifier + "/" + this._style + "/" + this._tileMatrixSetId + "/" + level + "/" + row + "/" + col + imagePostfix;
    }
    return tileUrl;
  },

  _parseResourceInfo: function () {
    var layerInfos = this.layerInfos;
    if (this.serviceMode === "KVP") {
      this._url += (this._url.substring(this._url.length - 1, this._url.length) == "?") ? "" : "?";
    }
    
    for (var i = 0; i < layerInfos.length; i++) {
      if ((!this._identifier || layerInfos[i].identifier === this._identifier) && (!this.title || layerInfos[i].title === this.title) && (!this._tileMatrixSetId || layerInfos[i].tileMatrixSet === this._tileMatrixSetId) && (!this.format || "image/" + layerInfos[i].format === this.format) && (!this._style || layerInfos[i].style === this._style)) {
        dojo.mixin(this, {"description": layerInfos[i].description, tileInfo: layerInfos[i].tileInfo, spatialReference: layerInfos[i].tileInfo.spatialReference, fullExtent: layerInfos[i].fullExtent, initialExtent: layerInfos[i].initialExtent, _identifier: layerInfos[i].identifier, _tileMatrixSetId: layerInfos[i].tileMatrixSet, format: "image/" + layerInfos[i].format, _style: layerInfos[i].style});
        break;
      }
    }
  },

  _getCapabilities: function () {
    var capabilitiesUrl;
    if (this.serviceMode === "KVP") {
      capabilitiesUrl = this._url + "?request=GetCapabilities&service=WMTS&version=" + this.version;
    } else if (this.serviceMode === "RESTful") {
      capabilitiesUrl = this._url + "/" + this.version + "/WMTSCapabilities.xml";
    }

    esri.request({
      url: capabilitiesUrl,
      handleAs: "text",
      load: this._parseCapabilities,
      error: this._getCapabilitiesError
    });
  },

  _parseCapabilities: function (xmlText) {
    xmlText = xmlText.replace(/ows:/gi, "");
    var xml = dojox.xml.parser.parse(xmlText);
    //copryright is AccessConstraints
    //find the url for getTile operation
    var metaData = dojo.query("OperationsMetadata", xml)[0];
    var getTile = dojo.query("[name='GetTile']", metaData)[0];
    var tileUrl = this.tileUrl;
    if (this._getAttributeValue("Get", "xlink:href", getTile)) {
      tileUrl = this._getAttributeValue("Get", "xlink:href", getTile);
    }
    if (tileUrl.indexOf("/1.0.0/") === -1 && this.serviceMode === "RESTful") {
      tileUrl += "/1.0.0/";
    }
    if (this.serviceMode === "KVP") {
      tileUrl += (tileUrl.substring(tileUrl.length - 1, tileUrl.length) == "?") ? "" : "?";
    }
    this._url = tileUrl;

    var contents = dojo.query("Contents", xml)[0];
    var rows, cols, origin, wkid, lod, lods = [];
    //find the layer
    if (!this._identifier) {
      this._identifier = this._getTagValues('Capabilities>Contents>Layer>Identifier', xml)[0];
    }
    //find copyright info according to AccessConstraints
    this.copyright = this._getTagValues('Capabilities>ServiceIdentification>AccessConstraints', xml)[0];
    var layer = this._getTagWithChildTagValue("Layer", "Identifier", this._identifier, contents);
    //find the description
    this.description = this._getTagValues("Abstract", layer)[0];
    this.title = this._getTagValues("Title", layer)[0];
    //find the style
    if (!this._style) {
      var styleTag = dojo.query("[isDefault='true']", layer)[0];
      if (styleTag) {
        this._style = this._getTagValues("Identifier", styleTag)[0];
      }
      this._style = this._getTagValues("Identifier", dojo.query("Style", layer)[0])[0];
    }
    //check if the format is supported
    var formats = this._getTagValues("Format", layer);
    if (!this.format) {
      this.format = formats[0];
    }
    if (dojo.indexOf(formats, this.format) === -1) {
      console.error("The format " + this.format + " is not supported by the service");
    }
    //if user doesn't provide tileMatrixSetId, search for "GoogleMapsCompatible",
    //then, use the first one.    
    var layerMatrixSetIds = this._getTagValues("TileMatrixSet", layer);
    if (!this._tileMatrixSetId) {
      if (dojo.indexOf(layerMatrixSetIds, "GoogleMapsCompatible") !== -1) {
        this._tileMatrixSetId = "GoogleMapsCompatible";
      } else {
        this._tileMatrixSetId = layerMatrixSetIds[0];
      }
    }

    var matrixSetLink = this._getTagWithChildTagValue("TileMatrixSetLink", "TileMatrixSet", this._tileMatrixSetId, layer);
    var layerMatrixIds = this._getTagValues("TileMatrix", matrixSetLink);
    var tileMatrixSet = this._getTagWithChildTagValue("TileMatrixSet", "Identifier", this._tileMatrixSetId, contents);
    var crs = this._getTagValues("SupportedCRS", tileMatrixSet)[0];
    wkid = crs.split(":").pop();
    if (wkid == 900913) {
      wkid = 3857;
    }
    if(wkid == 4490){
    	wkid = 4326;
    }
    this.spatialReference = new esri.SpatialReference({
      "wkid": wkid
    });
    var firstTileMatrix = dojo.query("TileMatrix", tileMatrixSet)[0];
    rows = parseInt(this._getTagValues("TileWidth", firstTileMatrix)[0], 10);
    cols = parseInt(this._getTagValues("TileHeight", firstTileMatrix)[0], 10);
    var topLeft = this._getTagValues("TopLeftCorner", firstTileMatrix)[0].split(" ");
    var top = topLeft[0],
        left = topLeft[1];
    if (top.split("E").length > 1) {
      var topNumbers = top.split("E");
      top = topNumbers[0] * Math.pow(10, topNumbers[1]);
    }
    if (left.split("E").length > 1) {
      var leftNumbers = left.split("E");
      left = leftNumbers[0] * Math.pow(10, leftNumbers[1]);
    }
    origin = {
      "x": parseInt(top, 10),
      "y": parseInt(left, 10)
    };

    //due to a wrong order of the topleft point in some of openlayer sample services
    //it needs to hard code the origin point. The only way is to look at the wkid
    if (wkid == 3857 || wkid == 102113 || wkid == 102100) {
      origin = {
        "x": -20037508.342787,
        "y": 20037508.342787
      };
    } else if (wkid == 4326) {
      origin = {
        "x": -180,
        "y": 90
      };
    }
    var matrixWidth = this._getTagValues("MatrixWidth", firstTileMatrix)[0];
    var matrixHeight = this._getTagValues("MatrixHeight", firstTileMatrix)[0];
    //find lod information, including level, scale and resolution for each level
    if (layerMatrixIds.length === 0) {
      var tileMatrixes = dojo.query("TileMatrix", tileMatrixSet);
      for (var j = 0; j < tileMatrixes.length; j++) {
        lod = this._getLodFromTileMatrix(tileMatrixes[j], wkid);
        lods.push(lod);
      }
    } else {
      for (var i = 0; i < layerMatrixIds.length; i++) {
        var tileMatrix = this._getTagWithChildTagValue("TileMatrix", "Identifier", layerMatrixIds[i], tileMatrixSet);
        lod = this._getLodFromTileMatrix(tileMatrix, wkid);
        lods.push(lod);
      }
    }

    var xmin = origin.x;
    var ymax = origin.y;
    //due to a bug in ArcGIS Server WMTS, always pick the larger one as horizontal number of tiles
    var horizontalTileNumber = matrixWidth > matrixHeight ? matrixWidth : matrixHeight;
    var verticalTileNumber = matrixWidth > matrixHeight ? matrixHeight : matrixWidth;
    var xmax = xmin + horizontalTileNumber * cols * lods[0].resolution;
    var ymin = ymax - verticalTileNumber * rows * lods[0].resolution;
    var extent = new esri.geometry.Extent(xmin, ymin, xmax, ymax);
    this.fullExtent = this.initialExtent = extent;
    
    
    if(wkid == 3857 || wkid == 102113 || wkid == 102100){
    	this.tileInfo = this.getTiledinfo("webMercator");
    	this.fullExtent = this.initialExtent = new esri.geometry.Extent(-20037508.342787, -20037508.342787, 20037508.342787, 20037508.342787, new esri.SpatialReference({
          wkid: 102100
        }))
    	
    } else if(wkid == 4490 || wkid == 4326 ){
    	this.tileInfo = this.getTiledinfo("geographic");
    	this.fullExtent = this.initialExtent = new esri.geometry.Extent(-180.0, -90.0, 180.0, 90.0, new esri.SpatialReference({
          wkid: 4326
        }));
    }
    //手动增加了几个参数,modified by Zhangn
    // if(this.options.addedParameters){
    	// this.fullExtent = this.initialExtent = this.options.addedParameters.fullExtent;
    // }
    // this.spatialReference = this.fullExtent.spatialReference;
//     
//     
    // this.tileInfo = new esri.layers.TileInfo({
      // "dpi": 90.71428571428571
    // });
    // dojo.mixin(this.tileInfo, {
      // "spatialReference": this.spatialReference
    // }, {
      // "format": this.format
    // }, {
      // "height": rows
    // }, {
      // "width": cols
    // }, {
      // "origin": origin
    // }, {
      // "lods": lods
    // });
//     
// //手动增加了几个参数,modified by Zhangn
    // if(this.options.addedParameters.tiledInfo){
    	// this.tileInfo = this.options.addedParameters.tiledInfo;
    // }
    this.loaded = true;
    this.onLoad(this);
  },

  _getCapabilitiesError: function (err) {
    console.error("Failed to get capabilities xml");
  },

  _getLodFromTileMatrix: function (tileMatrix, wkid) {
    var id = this._getTagValues("Identifier", tileMatrix)[0];
    var matrixScale = this._getTagValues("ScaleDenominator", tileMatrix)[0];
    if (matrixScale.split("E").length > 1) {
      var scaleNumbers = matrixScale.split("E");
      matrixScale = scaleNumbers[0] * Math.pow(10, scaleNumbers[1]);
    } else {
      matrixScale = parseFloat(matrixScale);
    }
    var unitConversion;
    if (esri._isDefined(esri.WKIDUnitConversion[wkid])) {
      unitConversion = esri.WKIDUnitConversion.values[esri.WKIDUnitConversion[wkid]];
    } else {
      //1 degree equals to a*2*PI/360 meters
      unitConversion = 111194.6519066546;
    }
     var resolution = matrixScale * 7 / 25000 / unitConversion;
    //var resolution = matrixScale /420735083.3208889;
    var lod = {
      "level": id,
      "scale": matrixScale,
      "resolution": resolution
    };
    return lod;
  },

  _getTag: function (tagName, xml) {
    var tags = dojo.query(tagName, xml);
    if (tags && tags.length > 0) {
      return tags[0];
    } else {
      return null;
    }
  },

  _getTagValues: function (tagTreeName, xml) {
    var tagValues = [];
    var tagNames = tagTreeName.split(">");
    var tag, values;
    tag = dojo.query(tagNames[0], xml)[0];
    if (tagNames.length > 1) {
      for (var i = 1; i < tagNames.length - 1; i++) {
        tag = dojo.query(tagNames[i], tag)[0];
      }
      values = dojo.query(tagNames[tagNames.length - 1], tag);
    } else {
      values = dojo.query(tagNames[0], xml);
    }

    if (values && values.length > 0) {
      dojo.forEach(values, function (value) {
        if (dojo.isIE) {
          tagValues.push(value.childNodes[0].nodeValue);
        } else {
          tagValues.push(value.textContent);
        }
      });
    }
    return tagValues;
  },

  _getAttributeValue: function (tagName, attrName, xml, defaultValue) {
    var value = dojo.query(tagName, xml);
    if (value && value.length > 0) {
      return value[0].getAttribute(attrName);
    } else {
      return defaultValue;
    }
  },

  _getTagWithChildTagValue: function (parentTagName, childTagName, tagValue, xml) {
    //find the immediate children with the name of parentTagName
    var children = xml.childNodes;
    var childTagValue;
    for (var j = 0; j < children.length; j++) {
      if (children[j].nodeName === parentTagName) {
        //tags.push(children[j]);
        if (dojo.isIE) {
          if (esri._isDefined(dojo.query(childTagName, children[j])[0])) {
            childTagValue = dojo.query(childTagName, children[j])[0].childNodes[0].nodeValue;
          }
        } else {
          if (esri._isDefined(dojo.query(childTagName, children[j])[0])) {
            childTagValue = dojo.query(childTagName, children[j])[0].textContent;
          }
        }
        if (childTagValue === tagValue) {
          return children[j];
        }
      }
    }
  },
  
  	  getTiledinfo: function(type){
	  	var tileInfo;
	  	if(type == "geographic"){
	  		tileInfo = new esri.layers.TileInfo({
	  		  "dpi": 90.71428571428571,    //必须，否则图错
	          "rows" : 256,
	            "cols" : 256,
	            "compressionQuality" : 0,
	            "origin" : {
	              "x" : -180,
	              "y" : 90
	            },
	            "spatialReference" : {
	              "wkid" : 4326
	            },
	            "lods" : [
				  {"level" : 1, "resolution" : 0.7031249999891485, "scale" : 2.958293554545656E8},
	              {"level" : 2, "resolution" : 0.35156249999999994, "scale" : 1.479146777272828E8},
	              {"level" : 3, "resolution" : 0.17578124999999997, "scale" : 7.39573388636414E7},
	              {"level" : 4, "resolution" : 0.08789062500000014, "scale" : 3.69786694318207E7},
	              {"level" : 5, "resolution" : 0.04394531250000007, "scale" : 1.848933471591035E7},
	              {"level" : 6, "resolution" : 0.021972656250000007, "scale" : 9244667.357955175},
	              {"level" : 7, "resolution" : 0.01098632812500002, "scale" : 4622333.678977588},
	              {"level" : 8, "resolution" : 0.00549316406250001, "scale" : 2311166.839488794},
	              {"level" : 9, "resolution" : 0.0027465820312500017, "scale" : 1155583.419744397},
	              {"level" : 10, "resolution" : 0.0013732910156250009, "scale" : 577791.7098721985},
	              {"level" : 11, "resolution" : 0.000686645507812499, "scale" : 288895.85493609926},
	              {"level" : 12, "resolution" : 0.0003433227539062495, "scale" : 144447.92746804963},
	              {"level" : 13, "resolution" : 0.00017166137695312503, "scale" : 72223.96373402482},
	              {"level" : 14, "resolution" : 0.00008583068847656251, "scale" : 36111.98186701241},
	              {"level" : 15, "resolution" : 0.000042915344238281406, "scale" : 18055.990933506204},
	              {"level" : 16, "resolution" : 0.000021457672119140645, "scale" : 9027.995466753102},
	              {"level" : 17, "resolution" : 0.000010728836059570307, "scale" : 4513.997733376551},
	              {"level" : 18, "resolution" : 0.000005364418029785169, "scale" : 2256.998866688275},
	              {"level" : 19, "resolution" : 2.68220901485e-6, "scale": 1128.499433344138},
				  {"level" : 20, "resolution" : 1.341104507425e-6, "scale": 564.2497166720688}
	            ]
	        });
	  	}else if(type == "webMercator"){
	  		tileInfo = new esri.layers.TileInfo({
	  		 "dpi": 90.71428571428571,   //必须，否则图错
	          "rows" : 256,
	            "cols" : 256,
	            "compressionQuality" : 0,
	            "origin" : {
	              "x" : -20037508.342787,
	              "y" : 20037508.342787
	            },
	            "spatialReference" : {
	              "wkid" : 102100
	            },
	            "lods" : [
	              {"level" : 1, "resolution" : 78271.51696402048, "scale" : 2.958293554545656E8},
	              {"level" : 2, "resolution" : 39135.75848201024, "scale" : 1.479146777272828E8},
	              {"level" : 3, "resolution" : 19567.87924100512, "scale" : 7.39573388636414E7},
	              {"level" : 4, "resolution" : 9783.93962050256, "scale" : 3.69786694318207E7},
	              {"level" : 5, "resolution" : 4891.96981025128, "scale" : 1.848933471591035E7},
	              {"level" : 6, "resolution" : 2445.98490512564, "scale" : 9244667.357955175},
	              {"level" : 7, "resolution" : 1222.99245256282, "scale" : 4622333.678977588},
	              {"level" : 8, "resolution" : 611.49622628141, "scale" : 2311166.839488794},
	              {"level" : 9, "resolution" : 305.748113140705, "scale" : 1155583.419744397},
	              {"level" : 10, "resolution" : 152.8740565703525, "scale" : 577791.7098721985},
	              {"level" : 11, "resolution" : 76.43702828517625, "scale" : 288895.85493609926},
	              {"level" : 12, "resolution" : 38.21851414258813, "scale" : 144447.92746804963},
	              {"level" : 13, "resolution" : 19.109257071294063, "scale" : 72223.96373402482},
	              {"level" : 14, "resolution" : 9.554628535647032, "scale" : 36111.98186701241},
	              {"level" : 15, "resolution" : 4.777314267823516, "scale" : 18055.990933506204},
	              {"level" : 16, "resolution" : 2.388657133911758, "scale" : 9027.995466753102},
	              {"level" : 17, "resolution" : 1.194328566955879, "scale" : 4513.997733376551},
	              {"level" : 18, "resolution" : 0.5971642834779395, "scale" : 2256.998866688275},
	              {"level" : 19, "resolution" : 0.2985821417389698, "scale": 1128.499433344138},
				  {"level" : 20, "resolution" : 0.1492910708694849, "scale": 564.2497166720688}
	            ]
	        });
	  	}else{
	  		alert("WMTS服务解析错误");
	  		return ;
  	}
  	
  	return tileInfo;
  }
});

dojo.mixin(esrichina.TianDiTuLayer, {
	    VEC_BASE_GCS: "vec_c",
	  	VEC_ANNO_GCS: "cva_c",
	  	VEC_ANNO_GCS_EN: "eva_c",
	  	  
		  VEC_BASE_WEBMERCATOR: "vec_w",
		  VEC_ANNO_WEBMERCATOR: "cva_w",
		  VEC_ANNO_WEBMERCATOR_EN: "eva_w",
		  
		  IMG_BASE_GCS:"img_c",
		  IMG_ANNO_GCS:"cia_c",
		  IMG_ANNO_GCS_EN:"eia_c",
		  
		  IMG_BASE_WEBMERCATOR: "img_w",
		  IMG_ANNO_WEBMERCATOR: "cia_w",
		  IMG_ANNO_WEBMERCATOR_EN: "eia_w",
		  
		  TER_BASE_GCS: "ter_c",
		  TER_ANNO_GCS: "cta_c",
		 // TER_ANNO_GCS_EN: "eta_c",
		  
		  TER_BASE_WEBMERCATOR: "ter_w",
		  TER_ANNO_WEBMERCATOR: "cta_w"
		 // TER_ANNO_WEBMERCATOR_EN: "eta_w"
   });


