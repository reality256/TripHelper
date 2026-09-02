// cloudfunctions/getRouteDistance/index.js
// 调用腾讯地图 WebService API 计算驾车距离和耗时
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const MAP_KEY = '4X5BZ-EWCWN-PXKFB-S6FSS-QWZMV-32B4P'

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) return { success: false, data: null, message: '无法获取用户身份' }

  const { from, to } = event
  if (!from || !to) return { success: false, data: null, message: '缺少起终点坐标' }

  var fromLat = Number(from.latitude)
  var fromLng = Number(from.longitude)
  var toLat = Number(to.latitude)
  var toLng = Number(to.longitude)

  if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
    return { success: false, data: null, message: '坐标格式无效' }
  }

  var fromStr = fromLat + ',' + fromLng
  var toStr = toLat + ',' + toLng

  return await callWithHttp(fromStr, toStr)
}

// 用 Node.js 原生 https 模块请求（云函数环境通用）
async function callWithHttp(fromStr, toStr) {
  var https = require('https')
  var url = 'https://apis.map.qq.com/ws/direction/v1/driving/?from=' + fromStr + '&to=' + toStr + '&key=' + MAP_KEY + '&get_polyline=1'

  return new Promise(function (resolve) {
    https.get(url, function (res) {
      var body = ''
      res.on('data', function (chunk) { body += chunk })
      res.on('end', function () {
        try {
          var data = JSON.parse(body)
          console.log('[getRouteDistance] status:', data.status, 'message:', data.message)
          if (data.status === 0 && data.result && data.result.routes && data.result.routes.length > 0) {
            var route = data.result.routes[0]
            console.log('[getRouteDistance] distance:', route.distance, 'duration:', route.duration)
            // 解析 polyline：腾讯差分编码 [lat0,lng0,Δlat1,Δlng1,Δlat2,Δlng2,...]
            // 第一个点是绝对坐标，后续是偏移量（单位 1/1,000,000 度）
            var polyline = []
            var rawPoly = route.polyline
            if (Array.isArray(rawPoly) && rawPoly.length >= 2) {
              polyline.push({ latitude: rawPoly[0], longitude: rawPoly[1] })
              for (var i = 2; i < rawPoly.length - 1; i += 2) {
                var prev = polyline[polyline.length - 1]
                polyline.push({
                  latitude: prev.latitude + rawPoly[i] / 1000000,
                  longitude: prev.longitude + rawPoly[i + 1] / 1000000
                })
              }
            }
            resolve({
              success: true,
              data: {
                distance: Math.round(route.distance / 100) / 10,  // 米 → km
                duration: Math.round(route.duration),               // API 返回分钟
                polyline: polyline
              },
              message: ''
            })
          } else {
            resolve({
              success: false,
              data: null,
              message: data.message || '路线计算失败'
            })
          }
        } catch (err) {
          resolve({ success: false, data: null, message: '接口响应解析失败' })
        }
      })
    }).on('error', function (err) {
      resolve({ success: false, data: null, message: '网络请求失败: ' + err.message })
    })
  })
}
