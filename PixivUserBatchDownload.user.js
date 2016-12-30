// ==UserScript==
// @name		PixivUserBatchDownload
// @name:zh-CN	P站画师个人作品批量下载工具
// @namespace	http://www.mapaler.com/
// @description	Batch download pixiv user's images in one key.
// @description:zh-CN	一键批量下载P站画师的全部作品
// @include		*://www.pixiv.net/*
// @include		*://touch.pixiv.net/*
// @exclude		*://www.pixiv.net/*mode=manga&illust_id*
// @exclude		*://www.pixiv.net/*mode=big&illust_id*
// @exclude		*://www.pixiv.net/*mode=manga_big*
// @exclude		*://www.pixiv.net/*search.php*
// @version		5.0.0
// @copyright	2017+, Mapaler <mapaler@163.com>
// @icon		http://www.pixiv.net/favicon.ico
// @grant       GM_xmlhttpRequest
// ==/UserScript==

var pubd = {}; //储存设置
pubd.touch = false;
if (pixiv.AutoView != undefined) //location.host.indexOf("touch")>=0
{
	console.info("当前访问的是P站桌面版");
}else
{
	pubd.touch=true;
	console.info("当前访问的是P站触屏手机版");
}

if (!pubd.touch) //桌面版
{

}
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


/* 
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



//获取token
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
		"Referer": "http://spapi.pixiv.net/",
	},
	data: "get_secure_url=1&client_id=bYGKuGVw91e0NMfPGp44euvGt59s&client_secret=HP3RmkgAmEGro0gn1x9ioawQE8WMfvLXDz3ZqxpK&grant_type=password&username=123&password=123&refresh_token=",
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

var domStart; //开始按钮
var domMenu; //菜单
var domDlgConfig; //设置窗口

startBuild(pubd.touch); //开始主程序
//开始构建UI
function startBuild(touch)
{
	if (touch) //手机版
	{

	}else
	{
		var btnStartInsertPlace = document.getElementsByClassName("user-relation")[0];

		var btnStartli = document.createElement("li");
		domMenu = buildMenu(touch);
		domStart = buildbtnStart(touch);
		btnStartli.appendChild(domStart);
		btnStartli.appendChild(domMenu);
		btnStartInsertPlace.appendChild(btnStartli);

		//var btnDlgInsertPlace = document.getElementsByClassName("layout-wrapper")[0] || document.body;
		var btnDlgInsertPlace = btnStartInsertPlace;
		domDlgConfig = builddlgConfig(touch);
		btnDlgInsertPlace.appendChild(domDlgConfig);
	}
}
//构建开始按钮
function buildbtnStart(touch)
{
	if (touch) //手机版
	{

	}else
	{
		var btnStart = document.createElement("a");
		btnStart.id = "pubd-button";
		btnStart.className = "pubd-button";
		//添加图标
		var icon = document.createElement("i");
		icon.className = "_icon sprites-down";
		btnStart.appendChild(icon);
		//添加文字
		var span = document.createElement("span");
		span.className = "text";
		span.innerHTML = "PUBD下载";
		btnStart.appendChild(span);

		btnStart.onclick = function()
		{
			domMenu.classList.toggle("display-none");
		}
	}
	return btnStart;
}
//构建菜单
function buildMenu(touch)
{
	var menu = document.createElement("ul");
	menu.id = "pubd-menu";
	menu.className = "pubd-menu display-none";
	
	menu.appendChild(buildMenuItem("RPC下载",null,function(){alert("点击下载")}));
	menu.appendChild(buildMenuItem("导出文件",null,function(){alert("点击文件")}));
	menu.appendChild(buildMenuItem("导出链接",null,function(){alert("点击链接")}));
	menu.appendChild(buildMenuItem("设置","pubd-menu-setting",function()
			{
				domMenu.classList.add("display-none");
				domDlgConfig.classList.toggle("display-none");
			})
		);
	return menu;

	//生成菜单项
	function buildMenuItem(title,classname,callback)
	{
		if (!classname)classname="";

		var item = document.createElement("li");
		//添加链接
		var a = document.createElement("a");
		a.className = "pubd-menu-item" + (classname?" "+classname:"");
		//添加图标
		var icon = document.createElement("i");
		icon.className = "pubd-menu-icon";
		a.appendChild(icon);
		//添加文字
		var span = document.createElement("span");
		span.className = "text";
		span.innerHTML = title;
		a.appendChild(span);
		a.onclick = callback;

		item.appendChild(a);

		return item;
	}
}
//创建一个通用的对话框
function buildGenneralDialog(touch)
{
	if (touch) //手机版
	{

	}else
	{
		var dlg = document.createElement("div");
		dlg.className = "pubd-dialog display-none";

		var cls = document.createElement("div");
		cls.className = "close";
		cls.onclick = function()
		{
			dlg.classList.add("display-none");
		}
		dlg.appendChild(cls);

		var ttl = document.createElement("div");
		ttl.className = "title";
		dlg.appendChild(ttl);

		var content = document.createElement("div");
		content.className = "dlg-content";
		dlg.appendChild(content);

	}
	return dlg;
}
//构建设置对话框
function builddlgConfig(touch)
{
	if (touch) //手机版
	{

	}else
	{
		var dlg = buildGenneralDialog(touch);
		dlg.id = "pubd-config";
		dlg.classList.add = "pubd-config";

		dlg.getElementsByClassName("dlg-content")[0].innerHTML="测试内容";
	}
	return dlg;
}