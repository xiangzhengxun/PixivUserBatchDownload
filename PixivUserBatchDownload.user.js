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
console.log("最初的位置");
var pubd = {}; //储存设置
pubd.touch = false; //是触屏
pubd.loggedIn = false; //登陆了

console.log("第一个位置");
var pixiv = unsafeWindow.pixiv;
if (pixiv && pixiv.user.loggedIn)
{
	pubd.loggedIn = true;
}
if (pixiv.AutoView != undefined) //location.host.indexOf("touch")>=0
{
	console.info("当前访问的是P站桌面版");
}else
{
	pubd.touch=true;
	console.info("当前访问的是P站触屏手机版");
}

// by zhangxinxu welcome to visit my personal website http://www.zhangxinxu.com/
// zxx.drag v1.0 2010-03-23 元素的拖拽实现

var params = {
	target: null,
	left: 0,
	top: 0,
	currentX: 0,
	currentY: 0,
	flag: false
};
//获取相关CSS属性
var getCss = function(o,key){
	return o.currentStyle? o.currentStyle[key] : document.defaultView.getComputedStyle(o,false)[key]; 	
};

//拖拽的实现
var startDrag = function(bar, target, callback){
	//o是移动对象
	bar.onmousedown = function(event){
		params.flag = true;
		params.target = bar.parentNode;
		dlgActive(params.target);
		if(getCss(params.target, "left") !== "auto"){
			params.left = getCss(params.target, "left");
		}
		if(getCss(params.target, "top") !== "auto"){
			params.top = getCss(params.target, "top");
		}

		if(!event){
			event = window.event;
			//防止IE文字选中
			bar.onselectstart = function(){
				return false;
			}  
		}
		var e = event;
		params.currentX = e.clientX;
		params.currentY = e.clientY;
	};
	document.onmouseup = function(){
		params.flag = false;	
		if(getCss(params.target, "left") !== "auto"){
			params.left = getCss(params.target, "left");
		}
		if(getCss(params.target, "top") !== "auto"){
			params.top = getCss(params.target, "top");
		}
	};
	document.onmousemove = function(event){
		var e = event ? event: window.event;
		if(params.flag){
			var nowX = e.clientX, nowY = e.clientY;
			var disX = nowX - params.currentX, disY = nowY - params.currentY;
			params.target.style.left = parseInt(params.left) + disX + "px";
			params.target.style.top = parseInt(params.top) + disY + "px";
		}
		
		if (typeof callback == "function") {
			callback(parseInt(params.left) + disX, parseInt(params.top) + disY);
		}
	}	
};

//激活某窗口
function dlgActive(dialog)
{
	var dlgs = document.getElementsByClassName("pubd-dialog");
	for (var dlgi=0;dlgi<dlgs.length;dlgi++)
	{
		dlgs[dlgi].classList.remove("pubd-dlg-active");//取消激活
	}
	dialog.classList.add("pubd-dlg-active");//添加激活
}

console.log("激活窗口");
/*
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
*/

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
var domDlgLogin; //登陆窗口
console.log("开始主程序之前");
startBuild(pubd.touch); //开始主程序
console.log("开始主程序之后");
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
		var btnDlgInsertPlace = document.body;
		domDlgLogin = buildDlgLogin(touch);
		domDlgConfig = buildDlgConfig(touch);
		btnDlgInsertPlace.appendChild(domDlgConfig);
		btnDlgInsertPlace.appendChild(domDlgLogin);
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
		btnStart.id = "pubd-start";
		btnStart.className = "pubd-start";
		//添加图标
		var icon = document.createElement("i");
		icon.className = "pubd-icon";
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
	menu.appendChild(buildMenuItem("选项","pubd-menu-setting",function()
			{
				domMenu.classList.add("display-none");
				domDlgConfig.classList.remove("display-none");
				dlgActive(domDlgConfig);
			})
		);
	menu.appendChild(buildMenuItem("使用说明/主页",null,"https://github.com/Mapaler/PixivUserBatchDownload/tree/develop_v5"));
	menu.appendChild(buildMenuItem("反馈/咨询",null,"https://github.com/Mapaler/PixivUserBatchDownload/issues"));
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
}
//创建一个通用的对话框
function buildGenneralDialog(touch,caption)
{
	if (touch) //手机版
	{

	}else
	{
		var dlg = document.createElement("div");
		dlg.className = "pubd-dialog display-none";

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

		//添加关闭按钮
		var cls = document.createElement("div");
		cls.className = "dlg-close";
		cls.onclick = function()
		{
			dlg.classList.add("display-none"); //这里不知道为什么不能用add
		}
		var clsTxt = document.createElement("div");
		clsTxt.className = "dlg-close-text";
		clsTxt.innerHTML = "X";
		cls.appendChild(clsTxt);
		dlg.appendChild(cls);

		//添加内容
		var content = document.createElement("div");
		content.className = "dlg-content";
		dlg.appendChild(content);

		startDrag(cpt, cpt.parentNode);
	}
	return dlg;
}
//构建设置对话框
function buildDlgConfig(touch)
{
	if (touch) //手机版
	{

	}else
	{
		var dlg = buildGenneralDialog(touch,"PUBD选项");
		dlg.id = "pubd-config";
		dlg.classList.add("pubd-config");

		var dlgc = dlg.getElementsByClassName("dlg-content")[0];

		var dl=document.createElement("dl");
		var dt=document.createElement("dt");
		dl.appendChild(dt);
		dt.innerHTML = "账户通行证(Access_Token)，登陆获取"
		var dd=document.createElement("dd");
		var ipt = document.createElement("input");
		ipt.type = "text";
		ipt.className = "pubd-token";
		ipt.name = "pubd-token";
		ipt.id = ipt.name;
		ipt.placeholder = "免登陆默认Token"
		dd.appendChild(ipt);
		
		var ipt = document.createElement("input");
		ipt.type = "button";
		ipt.className = "pubd-login";
		ipt.name = "pubd-login";
		ipt.id = ipt.name;
		ipt.value = "登陆账户"
		ipt.onclick = function()
		{
			domDlgLogin.classList.remove("display-none");
			dlgActive(domDlgLogin);
		}
		dd.appendChild(ipt);

		dl.appendChild(dd);
		dlgc.appendChild(dl);
	}
	return dlg;
}

//构建登陆对话框
function buildDlgLogin(touch)
{
	if (touch) //手机版
	{

	}else
	{
		var dlg = buildGenneralDialog(touch,"登陆账户");
		dlg.id = "pubd-login";
		dlg.classList.add("pubd-login");

		var dlgc = dlg.getElementsByClassName("dlg-content")[0];
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
		lblremember.appendChild(remember);
		lblremember.innerHTML += "记住账号密码（警告：明文保存于本地）";
		signup_form_nav.appendChild(lblremember);

		dlgc.appendChild(container_login);

		submit.onclick = function()
		{
			var loginPost = [
				["get_secure_url",1],
				["client_id","bYGKuGVw91e0NMfPGp44euvGt59s"],
				["client_secret","HP3RmkgAmEGro0gn1x9ioawQE8WMfvLXDz3ZqxpK"],
				["grant_type","password"],
				["username",pid.value],
				["password",pass.value],
				["refresh_token",""],
			];
			var loginPostStr = loginPost.map(function (item){
									return item.join("=");
								}).join("&");
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
						console.warn(jo);
						if (jo.has_error)
						{
							loginError("错误代码 " + jo.errors.system.code + " : " + jo.errors.system.message);
						}else
						{//登陆成功
							if (jo.response != undefined)
							{
								loginError("登陆成功");
								document.getElementById("pubd-token").value = jo.response.access_token;
							}else
							{
								loginError("理论上是登陆成功了，但出现了未知错误");
							}
						}
					}else
					{
						loginError("登录失败，返回不是JSON");
					}
				},
				onerror: function(response) {
					loginError("登录失败，AJAX访问失败");
				}
			})
		}
	}
	return dlg;
}
//登陆失败信息
function loginError(text)
{
	var error_msg_list = domDlgLogin.getElementsByClassName("error-msg-list")[0];
	error_msg_list.innerHTML = ""; //清空当前信息
	var error_msg_list_item = document.createElement("li");
	error_msg_list_item.className = "error-msg-list-item";
	error_msg_list_item.innerHTML = text;
	error_msg_list.appendChild(error_msg_list_item);
}