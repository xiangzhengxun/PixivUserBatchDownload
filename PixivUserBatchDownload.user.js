// ==UserScript==
// @name		PixivUserBatchDownload
// @name:zh-CN	P站画师个人作品批量下载工具
// @namespace	http://www.mapaler.com/
// @description	Batch download pixiv user's images in one key.
// @description:zh-CN	一键批量下载P站画师的全部作品
// @include		*://www.pixiv.net/*
// @exclude		*://www.pixiv.net/*mode=manga&illust_id*
// @exclude		*://www.pixiv.net/*mode=big&illust_id*
// @exclude		*://www.pixiv.net/*mode=manga_big*
// @exclude		*://www.pixiv.net/*search.php*
// @version		5.0.0
// @copyright	2017+, Mapaler <mapaler@163.com>
// @icon		http://www.pixiv.net/favicon.ico
// @grant       none
// ==/UserScript==

//访GM_xmlhttpRequest函数v1.2
if(typeof(GM_xmlhttpRequest) == "undefined")
{
	var GM_xmlhttpRequest = function(GM_param){

		var xhr = new XMLHttpRequest();	//创建XMLHttpRequest对象
		if(GM_param.responseType) xhr.responseType = GM_param.responseType;
		xhr.onreadystatechange = function()  //设置回调函数
		{
			if (xhr.readyState == 4 && xhr.status == 200 && GM_param.onload)
				GM_param.onload(xhr);
			if (xhr.readyState == 4 && xhr.status != 200 && GM_param.onerror)
				GM_param.onerror(xhr);
		}
		xhr.open(GM_param.method, GM_param.url, true);

		for (var header in GM_param.headers){
			xhr.setRequestHeader(header, GM_param.headers[header]);
		}

		xhr.send(GM_param.data ? GM_param.data : null);
	}
}

//API获取用户画数
GM_xmlhttpRequest({
	url:location.href,
	method:"get",
	responseType:"text",
	headers: {
		"Referer": "http://spapi.pixiv.net/",
		"Authorization":"Bearer WHDWCGnwWA2C8PRfQSdXJxjXp0G6ULRaRkkd6t5B6h8", //账户token，安卓默认为WHDWCGnwWA2C8PRfQSdXJxjXp0G6ULRaRkkd6t5B6h8
		"User-Agent": "PixivIOSApp/5.6.0",
	},
	onload: function(response) {
		var jo = JSON.parse(response.response)
		console.log(jo);
	},
	onerror: function(response) {
		var jo = JSON.parse(response.response)
		console.log(jo);
	}
})



/* //获取token
GM_xmlhttpRequest({
	url:"https://oauth.secure.pixiv.net/auth/token",
	method:"post",
	responseType:"text",
	headers: {
		'App-OS': 'ios',
		'App-OS-Version': '9.3.3',
		'App-Version': '6.0.9',
		'User-Agent': 'PixivIOSApp/6.0.9 (iOS 9.3.3; iPhone8,1)',
		'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', //重要
	},
	data: "get_secure_url=1&client_id=bYGKuGVw91e0NMfPGp44euvGt59s&client_secret=HP3RmkgAmEGro0gn1x9ioawQE8WMfvLXDz3ZqxpK&grant_type=password&username=用户名&password=密码&refresh_token=",
	onload: function(response) {
		var jo = JSON.parse(response.response)
		console.log(jo);
	},
	onerror: function(response) {
		var jo = JSON.parse(response.response)
		console.log(jo);
	}
})
*/