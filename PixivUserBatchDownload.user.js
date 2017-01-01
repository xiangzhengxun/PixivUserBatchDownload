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
// @version		5.0 开发版
// @copyright	2017+, Mapaler <mapaler@163.com>
// @icon		http://www.pixiv.net/favicon.ico
// @grant       GM_xmlhttpRequest
// ==/UserScript==

/*
 * 公共变量区
*/
var pubd = { //储存设置
	configVersion: 0, //当前设置版本，用于提醒是否需要重置
	touch:false, //是触屏
	loggedIn:false, //登陆了
	start:null, //开始按钮
	menu:null, //菜单
	dialog:{ //窗口些个
		config:null, //设置窗口
		login:null, //登陆窗口
	},
};

var scriptName = typeof(GM_info)!="undefined" ? (GM_info.script.localizedName ? GM_info.script.localizedName : GM_info.script.name) : "PixivUserBatchDownload"; //本程序的名称
var scriptVersion = typeof(GM_info)!="undefined" ? GM_info.script.version : "LocalDebug"; //本程序的版本
var scriptIcon = ((typeof (GM_info) != "undefined") && GM_info.script.icon) ? GM_info.script.icon : "http://www.pixiv.net/favicon.ico"; //本程序的图标

/*
 * 获取初始状态
*/
if (typeof(unsafeWindow)!="undefined")
	var pixiv = unsafeWindow.pixiv;
if (pixiv && pixiv.user.loggedIn)
{
	pubd.loggedIn = true;
}
if (typeof(pixiv.AutoView)!="undefined") //location.host.indexOf("touch")>=0
{
	console.info("当前访问的是P站桌面版");
}else
{
	pubd.touch=true;
	console.info("当前访问的是P站触屏手机版");
}

/*
 * Debug 用 仿GM函数区
*/
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
//仿GM_getValue函数v1.0
if(typeof(GM_getValue) == "undefined")
{
	var GM_getValue = function(name, type){
		var value = localStorage.getItem(name);
		if (value == undefined) return value;
		if ((/^(?:true|false)$/i.test(value) && type == undefined) || type == "boolean")
		{
			if (/^true$/i.test(value))
				return true;
			else if (/^false$/i.test(value))
				return false;
			else
				return Boolean(value);
		}
		else if((/^\-?[\d\.]+$/i.test(value) && type == undefined) || type == "number")
			return Number(value);
		else
			return value;
	}
}
//仿GM_setValue函数v1.0
if(typeof(GM_setValue) == "undefined")
{
	var GM_setValue = function(name, value){
		localStorage.setItem(name, value);
	}
}
//仿GM_deleteValue函数v1.0
if(typeof(GM_deleteValue) == "undefined")
{
	var GM_deleteValue = function(name){
		localStorage.removeItem(name);
	}
}
//仿GM_listValues函数v1.0
if(typeof(GM_listValues) == "undefined")
{
	var GM_listValues = function(){
		var keys = [];
		for (var ki=0, kilen=localStorage.length; ki<kilen; ki++)
		{
			keys.push(localStorage.key(ki));
		}
		return keys;
	}
}

//发送网页通知
function spawnNotification(theBody, theIcon, theTitle)
{
	var options = {
		body: theBody,
		icon: theIcon
	}
	if (!("Notification" in window))
	{
		alert(theBody);
	}
	else if (Notification.permission === "granted") {
		Notification.requestPermission(function (permission) {
		// If the user is okay, let's create a notification
		var n = new Notification(theTitle, options);
		});
	}
	// Otherwise, we need to ask the user for permission
	else if (Notification.permission !== 'denied') {
		Notification.requestPermission(function (permission) {
		// If the user is okay, let's create a notification
		if (permission === "granted") {
			var n = new Notification(theTitle, options);
		}
		});
	}
}

/*
 * 自定义对象区
*/
//创建菜单对象
var pubdMenu = (function () {
	//生成菜单项
	function buildMenuItem(title,classname,callback)
	{
		var item = document.createElement("li");
		//添加链接
		var a = document.createElement("a");
		a.className = "pubd-menu-item" + (classname?" "+classname:"");
		//添加图标
		var icon = document.createElement("i");
		icon.className = "pubd-icon";
		a.appendChild(icon);
		//添加文字
		var span = document.createElement("span");
		span.className = "text";
		span.innerHTML = title;
		a.appendChild(span);

		if (typeof(callback) == "string")
		{
			a.target = "_blank";
			a.href = callback;
		}
		else
		{
			if (callback) a.onclick = callback;
		}

		item.appendChild(a);
		return item;
	}

	return function(touch) {
		var menu = document.createElement("ul");
		menu.id = "pubd-menu";
		menu.className = "pubd-menu display-none";
		//添加菜单项
		menu.add = function(title,classname,callback)
		{
			var itm = buildMenuItem(title,classname,callback);
			this.appendChild(itm);
			return itm;
		}
		menu.add("RPC一键下载","",function()
				{
					alert("一键下载")
				}
			);
		menu.add("其他下载方式",null,function()
				{
					alert("高级下载窗口")
				}
			);
		menu.add("批量画师下载",null,function()
				{
					alert("做成“声音”的设备样子")
				}
			);
		menu.add("选项","pubd-menu-setting",function()
				{
					pubd.menu.classList.add("display-none");
					pubd.dialog.config.show();
				}
			);
		menu.add("关闭","pubd-menu-close",function()
				{
					pubd.menu.classList.add("display-none");
				}
			);
		return menu;
	};
})();
//创建通用对话框对象
var Dialog = (function () {
	//构建标题栏按钮
	function buildDlgCptBtn(text,classname,callback)
	{
		if (!callback)classname="";
		var btn = document.createElement("a");
		btn.className = "dlg-cpt-btn" + (classname?" "+classname:"");
		if (typeof(callback) == "string")
		{
			btn.target = "_blank";
			btn.href = callback;
		}
		else
		{
			if (callback)
				btn.addEventListener("mousedown",callback);
		}
		var btnTxt = document.createElement("div");
		btnTxt.className = "dlg-cpt-btn-text";
		btnTxt.innerHTML = text;
		btn.appendChild(btnTxt);

		return btn;
	}

	return function(caption,id,classname) {
		var dlg = document.createElement("div");
		dlg.className = "pubd-dialog display-none" + (classname?" "+classname:"");

		//添加图标与标题
		var cpt = document.createElement("div");
		cpt.className = "caption";
		var icon = document.createElement("i");
		icon.className = "pubd-icon";
		cpt.appendChild(icon);
		var span = document.createElement("span");
		span.innerHTML = caption;
		cpt.appendChild(span);
		dlg.appendChild(cpt);
		dlg.caption = span;
		dlg.icon = icon;

		//添加标题栏按钮
		var cptBtns = document.createElement("div");
		cptBtns.className = "dlg-cpt-btns";
		//添加关闭按钮
		cptBtns.add = function(text,classname,callback){
			var btn = buildDlgCptBtn(text,classname,callback);
			this.insertBefore(btn,this.firstChild);
			return btn;
		}
		cptBtns.close = cptBtns.add("X","dlg-btn-close",(function()
			{
				dlg.classList.add("display-none");
			}));
		dlg.appendChild(cptBtns);
		dlg.cptBtns = cptBtns; //captionButtons

		//添加内容
		var content = document.createElement("div");
		content.className = "dlg-content";
		dlg.appendChild(content);
		dlg.content = content;

		//窗口激活
		dlg.active = function()
		{
			var dlgs = document.getElementsByClassName("pubd-dialog");
			for (var dlgi=0;dlgi<dlgs.length;dlgi++)
			{
				dlgs[dlgi].classList.remove("pubd-dlg-active");//取消激活
			}
			this.classList.add("pubd-dlg-active");//添加激活
		}
		//窗口初始化
		dlg.initialise = function()
		{
			return;
		}
		//窗口显示
		dlg.show = function()
		{
			this.initialise();
			this.classList.remove("display-none");
			this.active();
		}
		//窗口隐藏
		dlg.hide = function()
		{
			this.cptBtns.close.click;
		}
		//添加鼠标拖拽移动
		dlg.drag = {disX: 0,disY: 0};
		//startDrag(cpt, dlg);
		cpt.addEventListener("mousedown",function(e){
			dlg.drag.disX = e.pageX - dlg.offsetLeft;
			dlg.drag.disY = e.pageY - dlg.offsetTop;
			var handler_mousemove = function (e) {
				dlg.style.left = (e.pageX - dlg.drag.disX) + 'px';
				dlg.style.top = (e.pageY - dlg.drag.disY) + 'px';
			};
			var handler_mouseup = function (e) {
				document.removeEventListener("mousemove",handler_mousemove);
			};
			document.addEventListener("mousemove",handler_mousemove);
			document.addEventListener("mouseup",handler_mouseup,{once:true});
		});
		//点击窗口激活窗口
		dlg.addEventListener("mousedown",function(e){
			dlg.active();
		});
		return dlg;
	};
})();
//创建选项卡
var Tab = (function () {

	return function(title) {
		var obj = {
			title:document.createElement("li"),
			content:document.createElement("li"),
		}
		obj.title = document.createElement("li");
		obj.title.className = "pubd-tab-title";
		obj.title.innerHTML = title;
		obj.name = function()
		{
			return this.title.innerHTML;
		}
		obj.rename = function(newName)
		{
			if (typeof(newName)=="string" && newName.length>0)
			{
				this.title.innerHTML = newName;
				return true;
			}else
				return false;
		}

		obj.content.className = "pubd-tab-content";
		obj.content.innerHTML = "设置内容";

		return obj;
	};
})();
//创建选项卡
var Tabs = (function () {

	return function() {
		var tabs = document.createElement("div");
		tabs.className = "pubd-tabs";
		tabs.item = []; //储存卡
		//添加卡名区域
		var ult = document.createElement("ul");
		ult.className = "tab-title";
		tabs.appendChild(ult);
		//添加卡内容区域
		var ulc = document.createElement("ul");
		ulc.className = "tab-content";
		tabs.appendChild(ulc);
		tabs.add = function(name)
		{
			var tab = new Tab(name);
			tabs.item.push(tab);
			ult.appendChild(tab.title);
			ulc.appendChild(tab.content);
		}
		return tabs;
	};
})();

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

//构建开始按钮
function buildbtnStart(touch)
{
	if (touch) //手机版
	{

	}else
	{
		var btnStart = document.createElement("a");
		btnStart.id = "pubd-start";
		btnStart.className = "pubd-start";
		//添加图标
		var icon = document.createElement("i");
		icon.className = "pubd-icon";
		btnStart.appendChild(icon);
		//添加文字
		var span = document.createElement("span");
		span.className = "text";
		span.innerHTML = "使用PUBD扒图";
		btnStart.appendChild(span);

		btnStart.onclick = function()
		{
			pubd.menu.classList.toggle("display-none");
		}
	}
	return btnStart;
}

//构建设置对话框
function buildDlgConfig(touch)
{
	var dlg = new Dialog("PUBD选项","pubd-config","pubd-config");
	dlg.cptBtns.add("反馈","dlg-btn-debug","https://github.com/Mapaler/PixivUserBatchDownload/issues");
	dlg.cptBtns.add("帮助","dlg-btn-help","https://github.com/Mapaler/PixivUserBatchDownload/tree/develop_v5");

	var dlgc = dlg.content;

	var dl=document.createElement("dl");
	dlgc.appendChild(dl);
	var dt=document.createElement("dt");
	dl.appendChild(dt);
	dt.innerHTML = "账户通行证(Access_Token)，登陆获取"
	var dd=document.createElement("dd");
	var ipt_token = document.createElement("input");
	ipt_token.type = "text";
	ipt_token.className = "pubd-token";
	ipt_token.name = "pubd-token";
	ipt_token.id = ipt_token.name;
	ipt_token.placeholder = "免登陆默认Token"
	dd.appendChild(ipt_token);
	
	var ipt = document.createElement("input");
	ipt.type = "button";
	ipt.className = "pubd-tologin";
	ipt.value = "登陆账户"
	ipt.onclick = function()
	{
		pubd.dialog.login.show();
	}
	dd.appendChild(ipt);
	dl.appendChild(dd);

	//选项卡栏
	var dt=document.createElement("dt");
	dl.appendChild(dt);
	var dd=document.createElement("dd");
	dd.className = "pubd-config-tab"
	var tabs = new Tabs();
	tabs.add("第一选项卡");
	tabs.add("第二选项卡");
	dd.appendChild(tabs);
	dl.appendChild(dd);

	//保存按钮栏
	var dt=document.createElement("dt");
	dl.appendChild(dt);
	var dd=document.createElement("dd");
	dd.className = "pubd-config-savebar"
	var ipt = document.createElement("input");
	ipt.type = "button";
	ipt.className = "pubd-reset";
	ipt.value = "重置"
	ipt.onclick = function()
	{
		spawnNotification("设置已重置", scriptIcon, scriptName);
		GM_deleteValue("pubd-token",ipt_token.value);
		GM_deleteValue("pubd-account");
		GM_deleteValue("pubd-password");
		GM_deleteValue("pubd-remember");
	}
	dd.appendChild(ipt);
	var ipt = document.createElement("input");
	ipt.type = "button";
	ipt.className = "pubd-save";
	ipt.value = "保存设置"
	ipt.onclick = function()
	{
		spawnNotification("设置已保存", scriptIcon, scriptName);
		GM_setValue("pubd-token",ipt_token.value);
	}
	dd.appendChild(ipt);
	dl.appendChild(dd);

	dlg.initialise = function(){
		ipt_token.value = GM_getValue("pubd-token");
	};
	return dlg;
}

//构建登陆对话框
function buildDlgLogin(touch)
{
	var dlg = new Dialog("登陆账户","pubd-login","pubd-login");

	var dlgc = dlg.content;
	//Logo部分
	var logo_box = document.createElement("div");
	logo_box.className = "logo-box";
	var logo = document.createElement("div");
	logo.className = "logo";
	logo_box.appendChild(logo);
	var catchphrase = document.createElement("div");
	catchphrase.className = "catchphrase";
	catchphrase.innerHTML = "登陆获取你的账户通行证，解除浏览限制"
	logo_box.appendChild(catchphrase);
	dlgc.appendChild(logo_box);
	//实际登陆部分
	var container_login = document.createElement("div");
	container_login.className = "container-login";

	var input_field_group = document.createElement("div");
	input_field_group.className = "input-field-group";
	container_login.appendChild(input_field_group);
	var input_field1 = document.createElement("div");
	input_field1.className = "input-field";
	var pid = document.createElement("input");
	pid.type = "text";
	pid.className = "pubd-account";
	pid.name = "pubd-account";
	pid.id = pid.name;
	pid.placeholder="邮箱地址/pixiv ID";
	input_field1.appendChild(pid);
	input_field_group.appendChild(input_field1);
	var input_field2 = document.createElement("div");
	input_field2.className = "input-field";
	var pass = document.createElement("input");
	pass.type = "password";
	pass.className = "pubd-password";
	pass.name = "pubd-password";
	pass.id =pass.name;
	pass.placeholder="密码";
	input_field2.appendChild(pass);
	input_field_group.appendChild(input_field2);
	
	var error_msg_list = document.createElement("ul"); //登陆错误信息
	error_msg_list.className = "error-msg-list";
	container_login.appendChild(error_msg_list);

	var submit = document.createElement("button");
	submit.className = "submit";
	submit.innerHTML = "登陆"
	container_login.appendChild(submit);

	var signup_form_nav = document.createElement("div");
	signup_form_nav.className = "signup-form-nav";
	container_login.appendChild(signup_form_nav);
	var lblremember = document.createElement("label");
	var remember = document.createElement("input"); //记住账号密码
	remember.type = "checkbox";
	remember.className = "pubd-remember";
	remember.name = "pubd-remember";
	remember.id = remember.name;
	lblremember.innerHTML += "记住账号密码（警告：明文保存于本地）";
	lblremember.insertBefore(remember,lblremember.firstChild);
	signup_form_nav.appendChild(lblremember);

	dlgc.appendChild(container_login);

	submit.onclick = function()
	{
		dlg.error.replace("登陆中···");
		var loginPost = [
			["get_secure_url",1],
			["client_id","bYGKuGVw91e0NMfPGp44euvGt59s"],
			["client_secret","HP3RmkgAmEGro0gn1x9ioawQE8WMfvLXDz3ZqxpK"],
			["grant_type","password"],
			["username",pid.value],
			["password",pass.value],
			["refresh_token",""],
		];
		var loginPostStr = loginPost.map(
				function (item){
					return item.join("=");
				}
			).join("&");
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
				"Referer": "https://spapi.pixiv.net/",
			},
			data: loginPostStr,
			onload: function(response) {
				var jo = JSON.parse(response.response)
				if (jo)
				{
					console.warn("登陆的Ajax返回",jo);
					if (jo.has_error)
					{
						dlg.error.replace(["错误代码：" + jo.errors.system.code,jo.errors.system.message]);
					}else
					{//登陆成功
						if (jo.response != undefined)
						{
							dlg.error.replace("登陆成功");
							pubd.dialog.config.getElementsByClassName("pubd-token")[0].value = jo.response.access_token;
						}else
						{
							dlg.error.replace("理论上是登陆成功了，但出现了未知错误");
						}
					}
				}else
				{
					dlg.error.replace("登录失败，返回不是JSON");
				}
			},
			onerror: function(response) {
				dlg.error.replace("登录失败，AJAX访问失败");
			}
		})
	}
	//添加错误功能
	error_msg_list.clear = function()
	{
		this.innerHTML = ""; //清空当前信息
	}
	error_msg_list.add = function(text)
	{
		var error_msg_list_item = document.createElement("li");
		error_msg_list_item.className = "error-msg-list-item";
		error_msg_list_item.innerHTML = text;
		this.appendChild(error_msg_list_item);
	}
	error_msg_list.adds = function(arr)
	{
		arr.forEach(
			function (item){
				error_msg_list.add(item);
			}
		)
	}
	error_msg_list.replace = function(text)
	{
		this.clear();
		if (typeof(text) == "object") //数组
			this.adds(text);
		else //单文本
			this.add(text);
	}
	dlg.error = error_msg_list;

	dlg.cptBtns.close.addEventListener("mousedown",function(e){
		GM_setValue("pubd-remember",remember);
		console.log(pid,pass);
		if (remember.checked)
		{
			GM_setValue("pubd-account",pid.value);
			GM_setValue("pubd-password",pass.value);
		}else
		{
			GM_deleteValue("pubd-account");
			GM_deleteValue("pubd-password");
		}
	});

	dlg.initialise = function(){
		remember.checked = GM_getValue("pubd-remember");
		if (remember.checked)
		{
			pid.value = GM_getValue("pubd-account");
			pass.value = GM_getValue("pubd-password");
		}
		error_msg_list.clear();
	};
	return dlg;
}

//开始构建UI
function startBuild(touch)
{
	if (touch) //手机版
	{
		alert("暂不支持手机版");
	}else
	{
		var btnStartInsertPlace = document.getElementsByClassName("user-relation")[0];

		var btnStartli = document.createElement("li");
		pubd.start = buildbtnStart(touch);
		pubd.menu = new pubdMenu(touch);
		btnStartli.appendChild(pubd.start);
		btnStartli.appendChild(pubd.menu);
		btnStartInsertPlace.appendChild(btnStartli);

		//var btnDlgInsertPlace = document.getElementsByClassName("layout-wrapper")[0] || document.body;
		var btnDlgInsertPlace = document.body;
		pubd.dialog.config = buildDlgConfig(touch);
		btnDlgInsertPlace.appendChild(pubd.dialog.config);
		pubd.dialog.login = buildDlgLogin(touch);
		btnDlgInsertPlace.appendChild(pubd.dialog.login);
	}
}

startBuild(pubd.touch); //开始主程序