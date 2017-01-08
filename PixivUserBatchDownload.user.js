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
		downthis:null, //下载当前窗口
	},
	auth:null,
	downSchemes:[],
};

var scriptName = typeof(GM_info)!="undefined" ? (GM_info.script.localizedName ? GM_info.script.localizedName : GM_info.script.name) : "PixivUserBatchDownload"; //本程序的名称
var scriptVersion = typeof(GM_info)!="undefined" ? GM_info.script.version : "LocalDebug"; //本程序的版本
var scriptIcon = ((typeof (GM_info) != "undefined") && GM_info.script.icon) ? GM_info.script.icon : "http://www.pixiv.net/favicon.ico"; //本程序的图标

/*
 * 获取初始状态
*/
if (typeof(unsafeWindow)!="undefined")
	var pixiv = unsafeWindow.pixiv;
if (typeof(pixiv)=="undefined")
{
	console.error("当前网页没有找到pixiv对象");
}
if (pixiv && pixiv.user.loggedIn)
{
	pubd.loggedIn = true;
}
if (location.host.indexOf("touch")>=0) //typeof(pixiv.AutoView)!="undefined"
{
	pubd.touch=true;
	console.info("当前访问的是P站触屏手机版");
}else
{
	console.info("当前访问的是P站桌面版");
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
		var keys = new Array();
		for (var ki=0, kilen=localStorage.length; ki<kilen; ki++)
		{
			keys.push(localStorage.key(ki));
		}
		return keys;
	}
}

/*
 * 现成函数库
*/
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
/*\
|*|
|*|  :: cookies.js ::
|*|
|*|  A complete cookies reader/writer framework with full unicode support.
|*|
|*|  https://developer.mozilla.org/en-US/docs/DOM/document.cookie
|*|
|*|  This framework is released under the GNU Public License, version 3 or later.
|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
|*|
|*|  Syntaxes:
|*|
|*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
|*|  * docCookies.getItem(name)
|*|  * docCookies.removeItem(name[, path], domain)
|*|  * docCookies.hasItem(name)
|*|  * docCookies.keys()
|*|
\*/

var docCookies = {
  getItem: function (sKey) {
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
        case Number:
          sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
          break;
        case String:
          sExpires = "; expires=" + vEnd;
          break;
        case Date:
          sExpires = "; expires=" + vEnd.toUTCString();
          break;
      }
    }
    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    return true;
  },
  removeItem: function (sKey, sPath, sDomain) {
    if (!sKey || !this.hasItem(sKey)) { return false; }
    document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ( sDomain ? "; domain=" + sDomain : "") + ( sPath ? "; path=" + sPath : "");
    return true;
  },
  hasItem: function (sKey) {
    return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
  },
  keys: /* optional method: you can safely remove it! */ function () {
    var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
    for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
    return aKeys;
  }
};

/*
 * 自定义对象区
*/
//一个用户的信息
var UserInfo = function()
{
	var obj = {
		done:false,
		info:{
			profile:null,
			user:null,
			profile:null,
		},
		illusts:{
			done:false,
			item:[],
			break:false,
			runing:false,
			next_url:"",
		},
		bookmarks:{
			done:false,
			item:[],
			break:false,
			runing:false,
			next_url:"",
		},
	}
	return obj;
}
//一个自定义掩码
var CustomMask = function(name,logic,content)
{
	var obj = {
		name:name?name:"",
		logic:logic?logic:"",
		content:content?content:"",
	}
	return obj;
}

//一个Post数据
var PostDataObject = (function () {
	
	return function(obj)
	{
		var postdata = new Object;
		if (obj)
			postdata.data = Object.assign({}, obj); //合并obj
		postdata.increase = function(obj)
		{
			postdata.data = Object.assign(postdata.data, obj); //合并obj
		}
		postdata.toPostString = function()
		{
			var arr = new Array;
			for (var na in postdata.data)
			{
				var item = [ na , postdata.data[na] ];
				arr.push(item);
			}
			
			var str = arr.map(
					function (item){
						return item.join("=");
					}
				).join("&");
			return str;
		}
		return postdata;
	}
})();

//一个本程序使用的headers数据
var HeadersObject = function (obj) {
	var headers = {
		'App-OS': 'android',
		'App-OS-Version': '6.0',
		'App-Version': '5.0.49',
		'User-Agent': 'PixivAndroidApp/5.0.49 (Android 6.0; LG-H818)',
		'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', //重要
		"Referer": "https://app-api.pixiv.net/",
	}
	if (obj)
		headers = Object.assign(headers, obj); //合并obj
	return headers;
}

//一个认证方案
var Auth = (function () {

	return function(username,password,remember)
	{
		if (!username) username = "";
		if (!password) password = "";
		if (!remember) remember = false;
		var auth = { //原始结构
			response:{
				access_token:"",
				expires_in:0,
				token_type:"",
				scope:"",
				refresh_token:"",
				user:{
					profile_image_urls:{
						px_16x16:"",
						px_50x50:"",
						px_170x170:"",
					},
					id:"",
					name:"",
					account:"",
					mail_address:"",
					is_premium:false,
					x_restrict:0,
					is_mail_authorized:true,
				},
				device_token:"",
			},
			needlogin:false,
			username:username,
			password:password,
			save_account:remember,
			login_date:null,
		}
		auth.newAccount = function(username,password,remember)
		{
			if(typeof(remember)=="boolean") auth.save_account = remember;
			auth.username = username;
			auth.password = password;
		}
		auth.loadFromResponse = function(response)
		{
			auth = Object.assign(auth, response);
		}
		auth.save = function()
		{
			var saveObj = JSON.parse(JSON.stringify(auth)); //深度拷贝
			if(!saveObj.save_account)
			{
				saveObj.username = "";
				saveObj.password = "";
			}
			GM_setValue("pubd-auth",JSON.stringify(saveObj));
		}

		auth.login = function(onload_suceess_Cb,onload_hasError_Cb,onload_notJson_Cb,onerror_Cb)
		{
			var postObj = new PostDataObject({ //Post时发送的数据
				client_id:"BVO2E8vAAikgUBW8FYpi6amXOjQj",
				client_secret:"LI1WsFUDrrquaINOdarrJclCrkTtc3eojCOswlog",
				grant_type:"password",
				username:auth.username,
				password:auth.password,
				//device_token:"6e50367b155c2ba9faeaf2152ee4607c",
				get_secure_url:"true",
			})
			var device_token = docCookies.getItem("device_token");
			if (device_token) postObj.increase({"device_token": device_token});

			//登陆是老的API
			GM_xmlhttpRequest({
				url:"https://oauth.secure.pixiv.net/auth/token",
				method:"post",
				responseType:"text",
				headers: new HeadersObject(),
				data: postObj.toPostString(),
				onload: function(response) {
					try
					{
						var jo = JSON.parse(response.responseText);
						if (jo.has_error || jo.errors)
						{
							console.error("登录失败，返回错误消息",jo);
							onload_hasError_Cb(jo);
						}else
						{//登陆成功
							auth.loadFromResponse(jo);
							auth.login_date = new Date();
							console.info("登陆成功",jo);
							onload_suceess_Cb(jo);
						}
					}catch(e)
					{
						console.error("登录失败，返回可能不是JSON，或程序异常",e,response);
						onload_notJson_Cb(response);
					}
				},
				onerror: function(response) {
					console.error("登录失败，AJAX发送失败",response);
					onerror_Cb(response);
				}
			})
		}
		return auth;
	};
})();

//一个下载方案
var DownScheme = (function () {

	return function(name)
	{
		var obj = {
			name:name?name:"默认方案",
			rpcurl:"http://localhost:6800/jsonrpc",
			savedir:"D:/PivixDownload/",
			savepath:"%{work.user.id}/%{work.filename}.%{work.extention}",
			masklist:[],
			mask:{
				add:function(name,logic,content){
					var mask = new CustomMask(name,logic,content);
					obj.masklist.push(mask);
					return mask;
				},
				remove:function(index){
					obj.masklist.splice(index, 1);
				},
			},
		}
		obj.masklist.push(new CustomMask("debug1","2","3"));
		obj.masklist.push(new CustomMask("debug2","3","4"));
		obj.masklist.push(new CustomMask("debug3","4","5"));
		obj.load = function(json)
		{
			if (typeof(json) == "string")
			{
				try
				{
					var json = JSON.parse(json);
				}catch(e)
				{
					console.error(e);
					return false;
				}
			}
			if (json.name) this.name = json.name;
			if (json.rpcurl) this.rpcurl = json.rpcurl;
			if (json.savedir) this.savedir = json.savedir;
			if (json.savepath) this.savepath = json.savepath;
			if (json.masklist) this.masklist = json.masklist;
			return true;
		}
		return obj;
	};
})();

//创建菜单类
var pubdMenu = (function () {
	//生成菜单项
	function buildMenuItem(title,classname,callback,submenu)
	{
		var item = document.createElement("li");
		item.subitem = null; //子菜单
		if (title == 0) //只添加一条线
		{
			item.className = "pubd-menu-line" + (classname?" "+classname:"");
			return item;
		}
		item.className = "pubd-menu-item" + (classname?" "+classname:"");
		//添加链接
		var a = document.createElement("a");
		a.className = "pubd-menu-item-a"
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
		else if (typeof(callback) == "function")
		{
			item.addEventListener("click",callback);
			//a.onclick = callback;
		}
	
		if (typeof(submenu) == "object")
		{
			item.classList.add("pubd-menu-includesub"); //表明该菜单项有子菜单
			submenu.classList.add("pubd-menu-submenu"); //表明该菜单是子菜单
			//a.addEventListener("mouseenter",function(){callback.show()});
			//a.addEventListener("mouseleave",function(){callback.hide()});
			item.appendChild(submenu);
			item.subitem = submenu;
		}

		item.appendChild(a);
		return item;
	}

	return function(touch,classname) {
		var menu = document.createElement("ul");
		menu.className = "pubd-menu display-none" + (classname?" "+classname:"");
		menu.item = new Array();
		//显示该菜单
		menu.show = function()
		{
			menu.classList.remove("display-none");
		}
		menu.hide = function()
		{
			menu.classList.add("display-none");
		}
		//添加菜单项
		menu.add = function(title,classname,callback,submenu)
		{
			var itm = buildMenuItem(title,classname,callback,submenu);
			this.appendChild(itm);
			this.item.push(itm)
			return itm;
		}
		//鼠标移出菜单时消失
		menu.addEventListener("mouseleave",function(e){
			this.hide();
		});
		return menu;
	};
})();

//创建通用对话框类
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
				btn.addEventListener("click",callback);
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
			if (!this.classList.contains("pubd-dlg-active"))
			{//如果没有激活的话才执行
				var dlgs = document.getElementsByClassName("pubd-dialog");
				for (var dlgi=0;dlgi<dlgs.length;dlgi++)
				{
					dlgs[dlgi].classList.remove("pubd-dlg-active");//取消激活
					dlgs[dlgi].style.zIndex = parseInt(window.getComputedStyle(dlgs[dlgi],null).getPropertyValue("z-index")) - 1;
				}
				this.style.zIndex = "";
				this.classList.add("pubd-dlg-active");//添加激活
			}
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

//创建选项卡类
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
			return this.title.textContent;
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

//创建复数选项卡类
var Tabs = (function () {

	return function() {
		var tabs = document.createElement("div");
		tabs.className = "pubd-tabs";
		tabs.item = new Array(); //储存卡
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

//创建框架类
var Frame = (function () {

	return function(title,classname) {
		var frame = document.createElement("div");
		frame.className = "pubd-frame" + (classname?" "+classname:"");
	
		var caption = document.createElement("div");
		caption.className = "pubd-frame-caption";
		caption.innerHTML = title;
		frame.caption = caption;
		frame.appendChild(caption);
		var content = document.createElement("div");
		content.className = "pubd-frame-content";
		frame.content = content;
		frame.appendChild(content);

		frame.name = function()
		{
			return this.caption.textContent;
		}
		frame.rename = function(newName)
		{
			if (typeof(newName)=="string" && newName.length>0)
			{
				this.caption.innerHTML = newName;
				return true;
			}else
				return false;
		}

		return frame;
	};
})();

//创建带Label的Input类
var LabelInput = (function () {

	return function(text,classname,name,type,value,beforeText) {
		var label = document.createElement("label");
		label.innerHTML = text;
		label.className = classname;

		var ipt = document.createElement("input");
		ipt.name = name;
		ipt.id = ipt.name;
		ipt.type = type;
		ipt.value = value;

		label.input = ipt;
		if (beforeText)
			label.insertBefore(ipt,label.firstChild);
		else
			label.appendChild(ipt);
		return label;
	};
})();

//创建进度条类
var Progress = (function () {
	//强制保留pos位小数，如：2，会在2后面补上00.即2.00 
	function toDecimal2(num,pos) { 
		var f = parseFloat(num); 
		if (isNaN(f)) { 
			return false; 
		} 
		var f = Math.round(num*Math.pow(10,pos))/Math.pow(10,pos); 
		var s = f.toString(); 
		var rs = s.indexOf('.'); 
		if (pos > 0 && rs < 0) { 
			rs = s.length; 
			s += '.'; 
		} 
		while (s.length <= rs + pos) { 
			s += '0'; 
		}
		return s;
	}

	return function(classname,align_right) {
		var progress = document.createElement("div");
		progress.className = "pubd-progress" + (classname?" "+classname:"");
		if (align_right) progress.classList.add("pubd-progress-right");

		progress.scaleNum = 0;

		var bar = document.createElement("div");
		bar.className = "pubd-progress-bar";
		progress.appendChild(bar);

		var txt = document.createElement("span");
		txt.className = "pubd-progress-text";
		progress.appendChild(txt);

		progress.set = function(scale,pos,str)
		{
			if (!pos) pos = 2;
			var  percentStr = toDecimal2((scale * 100),pos) + "%";
			scale = scale>1?1:(scale<0?0:scale);
			this.scaleNum = scale;
			bar.style.width = percentStr;
			if (str)
				txt.innerHTML = str;
			else
				txt.innerHTML = percentStr;
		}
		progress.scale = function()
		{
			return this.scaleNum;
		}

		return progress;
	};
})();

//创建用户卡片类
var UserCard = (function () {

	return function(userid) {
		var uinfo = document.createElement("div");
		uinfo.userid = userid;
		uinfo.className = "pubd-user-info";
		var uhead = document.createElement("div");
		uhead.className = "pubd-user-info-head";
		uinfo.appendChild(uhead);
		var uhead_img = document.createElement("img");
		uinfo.uhead = uhead_img;
		uhead.appendChild(uhead_img);
		uinfo.uhead = uhead_img;

		var infos = document.createElement("dl");
		infos.className = "pubd-user-info-dl";
		//ID
		var dt=document.createElement("dt");
		dt.className = "pubd-user-info-id-dt";
		dt.innerHTML = "ID"
		infos.appendChild(dt);
		var dd=document.createElement("dd");
		dd.className = "pubd-user-info-id-dd";
		dd.innerHTML = uinfo.userid;
		uinfo.uid = dd;
		infos.appendChild(dd);
		//作品数
		var dt=document.createElement("dt");
		dt.className = "pubd-user-info-illusts-dt";
		dt.innerHTML = "作品投稿数"
		infos.appendChild(dt);
		var dd=document.createElement("dd");
		dd.className = "pubd-user-info-illusts-dd";
		uinfo.uillusts = dd;
		infos.appendChild(dd);
		//昵称
		var dt=document.createElement("dt");
		dt.className = "pubd-user-info-name-dt";
		dt.innerHTML = "昵称"
		infos.appendChild(dt);
		var dd=document.createElement("dd");
		dd.className = "pubd-user-info-name-dd";
		uinfo.uname = dd;
		infos.appendChild(dd);
		//收藏数
		var dt=document.createElement("dt");
		dt.className = "pubd-user-info-bookmarks-dt";
		dt.innerHTML = "插画收藏数"
		infos.appendChild(dt);
		var dd=document.createElement("dd");
		dd.className = "pubd-user-info-bookmarks-dd";
		uinfo.ubookmarks = dd;
		infos.appendChild(dd);

		uinfo.infos = infos;
		uinfo.appendChild(infos);

		uinfo.set = function(obj)
		{
			if (obj.id)
			{
				uinfo.userid = obj.id;
				uinfo.uid.innerHTML = obj.id;
			}
			if (obj.head) uinfo.uhead.src = obj.head;
			if (obj.name) uinfo.uname.innerHTML = obj.name;
			if (obj.illusts) uinfo.uillusts.innerHTML = obj.illusts;
			if (obj.bookmarks) uinfo.ubookmarks.innerHTML = obj.bookmarks;
		}
		return uinfo;
	};
})();

//创建下拉框类
var Select = (function () {
	return function(classname,name) {
		var select = document.createElement("select");
		select.className = "pubd-select" + (classname?" "+classname:"");
		select.name = name;
		select.id = select.name;

		select.add = function(text,value)
		{
			var opt = new Option(text, value);
			this.options.add(opt);
		}
		select.remove = function(index)
		{
			this.options.remove(index);
		}

		return select;
	};
})();

//创建Aria2类
var Aria2 = (function () {
	var jsonrpc_version = '2.0';

	function get_auth(url) {
		return url.match(/^(?:(?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(?:\/\/)?(?:([^:@]*(?::[^:@]*)?)?@)?/)[1];
	};

	function request(jsonrpc_path, method, params,callback, priority) {
		var xhr = new XMLHttpRequest();
		var auth = get_auth(jsonrpc_path);
		jsonrpc_path = jsonrpc_path.replace(/^((?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(\/\/)?(?:(?:[^:@]*(?::[^:@]*)?)?@)?(.*)/, '$1$2$3'); // auth string not allowed in url for firefox

		var request_obj = {
			jsonrpc: jsonrpc_version,
			method: method,
			id: priority ? "1" : (new Date()).getTime().toString(),
		};
		if (params) request_obj['params'] = params;
		if (auth && auth.indexOf('token:') == 0) params.unshift(auth);

		var headers = {"Content-Type":"application/x-www-form-urlencoded; charset=UTF-8",}
		if (auth && auth.indexOf('token:') != 0) {
			headers.Authorization = "Basic " + btoa(auth);
		}
		GM_xmlhttpRequest({
			url: jsonrpc_path + "?tm=" + (new Date()).getTime().toString(),
			method:"POST",
			responseType:"text",
			data:JSON.stringify(request_obj),
			headers: headers,
			onload: function(response) {
				console.log(response);
				try
				{
					var JSONreq = JSON.parse(response.response);
					callback(JSONreq);
				}catch(e)
				{
					console.error(e);
					callback(false);
				}
			},
			onerror: function(response) {
				console.log(response);
				callback(false);
			}
		})
	};

	return function (jsonrpc_path) {
		this.jsonrpc_path = jsonrpc_path;
		this.addUri = function (uri, options) {
			request(this.jsonrpc_path, 'aria2.addUri', [[uri, ], options]);
		};
		this.addTorrent = function (base64txt, options)
		{
			request(this.jsonrpc_path, 'aria2.addTorrent', [base64txt, [], options]);
		};
		this.getVersion = function (callback) {
			request(this.jsonrpc_path, 'aria2.getVersion', [], callback, true);
		};
		this.getGlobalOption = function (callback) {
			request(this.jsonrpc_path, 'aria2.getGlobalOption', [], callback, true);
		};
		return this;
	}
})();

/*
 * 自定义函数区
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

		//鼠标移入和按下都起作用
		//btnStart.addEventListener("mouseenter",function(){pubd.menu.show()});
		btnStart.addEventListener("click",function(){pubd.menu.classList.toggle("display-none")});
	}
	return btnStart;
}

//构建菜单
function buildbtnMenu(touch)
{
	if (touch) //手机版
	{

	}else
	{
		var menu2 = new pubdMenu(touch);
		menu2.add("子菜单1","",function(){alert("子菜单1")});
		menu2.add("子菜单2","",function(){alert("子菜单2")});
		var menu1 = new pubdMenu(touch);
		menu1.add("子菜单1","",function(){alert("子菜单1")});
		menu1.add("子菜单2","",null,menu2);
		var menu3 = new pubdMenu(touch);
		menu3.add("子菜单1","",function(){alert("子菜单1")});
		menu3.add("子菜单2","",function(){alert("子菜单2")});
		menu3.add("子菜单2","",function(){alert("子菜单3")});
		menu3.add("子菜单2","",function(){alert("子菜单4")});
		var menu4 = new pubdMenu(touch);
		menu4.add("子菜单1","",null,menu3);
		menu4.add("子菜单2","",function(){alert("子菜单2")});
		menu4.add("子菜单2","",function(){alert("子菜单5")});
		menu4.add("子菜单2","",function(){alert("子菜单6")});

		var menu = new pubdMenu(touch,"pubd-menu-main");
		menu.id = "pubd-menu";
		menu.add("下载该画师","",function()
				{
					pubd.dialog.downthis.show();
					menu.hide();
				}
			);
		menu.add("Debug2","",null,menu4);
		menu.add("Debug1","",null,menu1);
		menu.add("多个画师下载",null,function()
				{
					alert("做成“声音”的设备样子")
				}
			);
		menu.add(0);
		menu.add("选项","pubd-menu-setting",function()
				{
					pubd.dialog.config.show();
					menu.hide();
				}
			);
	}
	return menu;
}

//构建设置对话框
function buildDlgConfig(touch)
{
	var dlg = new Dialog("PUBD选项 v" + scriptVersion,"pubd-config","pubd-config");
	dlg.cptBtns.add("反馈","dlg-btn-debug","https://github.com/Mapaler/PixivUserBatchDownload/issues");
	dlg.cptBtns.add("？","dlg-btn-help","https://github.com/Mapaler/PixivUserBatchDownload/tree/develop_v5");
	dlg.token_ani = null; //储存Token进度条动画句柄
	var dlgc = dlg.content;

	var dl=document.createElement("dl");
	dlgc.appendChild(dl);
	var dt=document.createElement("dt");
	dl.appendChild(dt);
	dt.innerHTML = "Pixiv访问权限，默认仅能访问公开作品";
	var dd=document.createElement("dd");
	var checkbox = new LabelInput("开启登陆功能，解除浏览限制","pubd-needlogin","pubd-needlogin","checkbox","1",true);
	dlg.needlogin = checkbox.input;
	dlg.needlogin.onclick = function()
	{
		if (dlg.needlogin.checked)
		{
			dlg.token_info.classList.remove("height-none");
			dlg.start_token_animate();
		}else
		{	
			dlg.token_info.classList.add("height-none");
			dlg.stop_token_animate();
		}
		pubd.dialog.login.cptBtns.close.click();
	}
	dd.appendChild(checkbox);

	var a_setting = document.createElement("a");
	a_setting.className = "pubd-browsing-restriction";
	a_setting.href = "http://www.pixiv.net/setting_user.php#over-18";
	a_setting.target = "_blank";
	a_setting.innerHTML = "设置我的账户浏览限制";
	dd.appendChild(a_setting);
	dl.appendChild(dd);
	var dd=document.createElement("dd");
	dd.className = "pubd-token-info height-none";
	dlg.token_info = dd;
	var progress = new Progress("pubd-token-expires",true);
	dlg.token_expires = progress;
	dd.appendChild(progress);
	//开始动画
	dlg.start_token_animate = function()
	{
		//if (!dlg.classList.contains("display-none"))
		//{
			dlg.stop_token_animate();
			dlg.token_ani = setInterval(function () {requestAnimationFrame(token_animate)}, 1000);
		//}
	}
	//停止动画
	dlg.stop_token_animate = function()
	{
		clearInterval(dlg.token_ani);
	}
	//动画具体实现
	function token_animate()
	{
		var nowdate = new Date();
		var olddate = new Date(pubd.auth.login_date);
		var expires_in = parseInt(pubd.auth.response.expires_in);
		var differ = expires_in - (nowdate - olddate)/1000;
		var scale = differ / expires_in;
		if (differ>0)
		{
			progress.set(scale,2,"Token有效剩余" + parseInt(differ) + "秒");
		}else
		{
			progress.set(0,2,"Token已失效，请重新登录");
			clearInterval(dlg.token_ani);
		}
		//console.log("Token有效剩余" + differ + "秒"); //检测动画后台是否停止
	}

	var ipt = document.createElement("input");
	ipt.type = "button";
	ipt.className = "pubd-tologin";
	ipt.value = "账户登陆"
	ipt.onclick = function()
	{
		pubd.dialog.login.show();
	}
	dd.appendChild(ipt);
	dl.appendChild(dd);

/*
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
*/
	//配置方案储存
	dlg.schemes = pubd.downSchemes;
	dlg.reloadSchemes = function()
	{
		dlg.downScheme.options.length = 0;
		dlg.schemes.forEach(function(item,index){
			dlg.downScheme.add(item.name,index);
		})
		if (dlg.downScheme.options.length > 0)
			dlg.downScheme.selectedIndex = 0;
	}
	dlg.loadScheme = function(scheme)
	{
		this.rpcurl.value = scheme.rpcurl;
		this.savedir.value = scheme.savedir;
		this.savepath.value = scheme.savepath;
		this.masklist = this.loadMasklist(scheme.masklist);
	}
	dlg.loadMasklist = function(masklist)
	{
		this.masklist.length = 0;
		masklist.forEach(function(item,index){
			var text = item.name + " : " + item.logic + " : " + item.content;
			dlg.masklist.add(text,index);
		})
	}
	//配置方案选择
	var dt=document.createElement("dt");
	dt.innerHTML = "选择下载方案";
	dl.appendChild(dt);
	var dd=document.createElement("dd");
	var slt = new Select("pubd-downscheme");
	slt.onchange = function()
	{
		if (this.options.length<1 || this.selectedOptions.length<1){return;}
		var scheme = dlg.schemes[this.selectedIndex];
		dlg.loadScheme(scheme);
	};
	dlg.downScheme = slt;
	dd.appendChild(slt);
	
	var ipt = document.createElement("input");
	ipt.type = "button";
	ipt.className = "pubd-downscheme-new";
	ipt.value = "新建"
	ipt.onclick = function()
	{
		var schemName = prompt("请输入方案名","我的方案");
		var scheme = new DownScheme(schemName);
		var length = dlg.schemes.push(scheme);
		dlg.downScheme.add(scheme.name,length-1);
		dlg.downScheme.selectedIndex = length-1;
		dlg.loadScheme(scheme);
		console.log(scheme);
		//dlg.reloadSchemes();
	}
	dd.appendChild(ipt);

	var ipt = document.createElement("input");
	ipt.type = "button";
	ipt.className = "pubd-downscheme-remove";
	ipt.value = "删除"
	ipt.onclick = function()
	{
		if (dlg.downScheme.options.length < 1){alert("已经没有方案了");return;}
		if (dlg.downScheme.selectedOptions.length < 1){alert("没有选中方案");return;}
		var index = dlg.downScheme.selectedIndex;
		dlg.schemes.splice(index, 1);
		dlg.downScheme.remove(index);
		var index = dlg.downScheme.selectedIndex;
		if (index<0) dlg.reloadSchemes();//没有选中的，重置
		dlg.loadScheme(dlg.schemes[index]);
		
	}
	dd.appendChild(ipt);
	dl.appendChild(dd);

	//Aria2 URL

	var dt=document.createElement("dt");
	dl.appendChild(dt);
	dt.innerHTML = "Aria2 JSON-RPC 路径"
	var rpcchk = document.createElement("span"); //显示检查状态用
	rpcchk.className = "pubd-rpcchk-info";
	dlg.rpcchk = rpcchk;
	dlg.rpcchk.runing = false;
	dt.appendChild(rpcchk);
	var dd=document.createElement("dd");
	var rpcurl = document.createElement("input");
	rpcurl.type = "url";
	rpcurl.className = "pubd-rpcurl";
	rpcurl.name = "pubd-rpcurl";
	rpcurl.id = rpcurl.name;
	rpcurl.placeholder = "Aria2的信息接收路径"
	rpcurl.onchange =  function()
	{
		dlg.rpcchk.innerHTML = "";
		dlg.rpcchk.runing = false;
	}
	dlg.rpcurl = rpcurl;
	dd.appendChild(rpcurl);

	var ipt = document.createElement("input");
	ipt.type = "button";
	ipt.className = "pubd-rpcchk";
	ipt.value = "检查路径"
	ipt.onclick = function()
	{
		if (dlg.rpcchk.runing) return;
		if (dlg.rpcurl.value.length < 1)
		{	
			dlg.rpcchk.innerHTML = "路径为空";
			return;
		}
		dlg.rpcchk.innerHTML = "正在连接...";
		dlg.rpcchk.runing = true;
		var aria2 = new Aria2(dlg.rpcurl.value);
		aria2.getVersion(function (rejo){
			if (rejo)
				dlg.rpcchk.innerHTML="发现Aria2 ver" + rejo.result.version;
			else
				dlg.rpcchk.innerHTML="Aria2连接失败";
			dlg.rpcchk.runing = false;
		});
	}
	dd.appendChild(ipt);
	dl.appendChild(dd);

	//下载目录
	var dt=document.createElement("dt");
	dl.appendChild(dt);
	dt.innerHTML = "下载目录"
	var dd=document.createElement("dd");
	var savedir = document.createElement("input");
	savedir.type = "text";
	savedir.className = "pubd-savedir";
	savedir.name = "pubd-savedir";
	savedir.id = savedir.name;
	savedir.placeholder = "文件下载到的目录"
	dlg.savedir = savedir;
	dd.appendChild(savedir);
	dl.appendChild(dd);

	//保存路径
	var dt=document.createElement("dt");
	dl.appendChild(dt);
	dt.innerHTML = "保存路径"
	var dd=document.createElement("dd");
	var savepath = document.createElement("input");
	savepath.type = "text";
	savepath.className = "pubd-savepath";
	savepath.name = "pubd-savedir";
	savepath.id = savepath.name;
	savepath.placeholder = "分组保存的文件夹和文件名"
	dlg.savepath = savepath;
	dd.appendChild(savepath);
	dl.appendChild(dd);

	//自定义掩码
	var dt=document.createElement("dt");
	dl.appendChild(dt);
	dt.innerHTML = "自定义掩码"
	var dd=document.createElement("dd");
	dl.appendChild(dd);
	var ipt = document.createElement("input");
	ipt.type = "text";
	ipt.className = "pubd-mask-id";
	ipt.name = "pubd-mask-id";
	ipt.id = ipt.name;
	ipt.placeholder = "自定义掩码名"
	dd.appendChild(ipt);
	var ipt = document.createElement("input");
	ipt.type = "text";
	ipt.className = "pubd-mask-content";
	ipt.name = "pubd-mask-content";
	ipt.id = ipt.name;
	ipt.placeholder = "掩码内容"
	dd.appendChild(ipt);
	var ipt = document.createElement("input");
	ipt.type = "button";
	ipt.className = "pubd-mask-add";
	ipt.value = "+"
	dd.appendChild(ipt);
	var ipt = document.createElement("input");
	ipt.type = "button";
	ipt.className = "pubd-mask-remove";
	ipt.value = "-"
	dd.appendChild(ipt);
	var ipt = document.createElement("input");
	ipt.type = "text";
	ipt.className = "pubd-mask-logic";
	ipt.name = "pubd-mask-logic";
	ipt.id = ipt.name;
	ipt.placeholder = "执行条件"
	dd.appendChild(ipt);

	var dd=document.createElement("dd");
	var masklist = new Select("pubd-mask-list")
	masklist.size = 5;
	dlg.masklist = masklist;
	dd.appendChild(masklist);
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
		GM_deleteValue("pubd-auth"); //登陆相关信息
	}
	dd.appendChild(ipt);
	var ipt = document.createElement("input");
	ipt.type = "button";
	ipt.className = "pubd-save";
	ipt.value = "保存设置"
	ipt.onclick = function()
	{
		spawnNotification("设置已保存", scriptIcon, scriptName);
		pubd.auth.needlogin = dlg.needlogin.checked;
		pubd.auth.save();
	}
	dd.appendChild(ipt);
	dl.appendChild(dd);

	//窗口关闭
	dlg.close = function(){
		dlg.stop_token_animate();
	};
	//关闭窗口按钮
	dlg.cptBtns.close.addEventListener("click",dlg.close);
	//窗口初始化
	dlg.initialise = function(){
		dlg.needlogin.checked = pubd.auth.needlogin;
		if (pubd.auth.needlogin) //如果要登陆，就显示Token区域，和动画
		{
			dlg.token_info.classList.remove("height-none");
			dlg.start_token_animate();
		}
		else
		{
			dlg.token_info.classList.add("height-none");
		}
		//ipt_token.value = pubd.auth.response.access_token;
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
	catchphrase.innerHTML = "登陆获取你的账户通行证，解除年龄限制"
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
	dlg.pid = pid;
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
	dlg.pass = pass;
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
	var checkbox = new LabelInput("记住账号密码（警告：明文保存于本地）","pubd-remember","pubd-remember","checkbox","1",true);
	dlg.remember = checkbox.input;
	signup_form_nav.appendChild(checkbox);
	dlgc.appendChild(container_login);

	submit.onclick = function()
	{
		dlg.error.replace("登陆中···");

		pubd.auth.newAccount(pid.value,pass.value,dlg.remember.checked);

		pubd.auth.login(
			function(jore){//onload_suceess_Cb
				dlg.error.replace("登陆成功");
				pubd.dialog.config.start_token_animate();
				//pubd.dialog.config.token.value = jore.response.access_token;
			},
			function(jore){//onload_haserror_Cb //返回错误消息
				dlg.error.replace(["错误代码：" + jore.errors.system.code,jore.errors.system.message]);
			},
			function(re){//onload_notjson_Cb //返回不是JSON
				dlg.error.replace("返回不是JSON，或程序异常");
			},
			function(re){//onerror_Cb //AJAX发送失败
				dlg.error.replace("AJAX发送失败");
			}
		);
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
	//窗口关闭
	dlg.close = function(){
		pubd.auth.newAccount(pid.value,pass.value,dlg.remember.checked);
		pubd.auth.save();
	};
	//关闭窗口按钮
	dlg.cptBtns.close.addEventListener("click",dlg.close);
	//窗口初始化
	dlg.initialise = function(){
		dlg.remember.checked = pubd.auth.save_account;
		pid.value = pubd.auth.username||"";
		pass.value = pubd.auth.password||"";
		error_msg_list.clear();
	};
	return dlg;
}


//构建当前画师下载对话框
function buildDlgDownThis(touch,userid)
{
	var dlg = new Dialog("下载当前画师","pubd-downthis","pubd-downthis");
	dlg.user = new UserInfo();

	var dlgc = dlg.content;

	var dl=document.createElement("dl");
	dlgc.appendChild(dl);

	var dt=document.createElement("dt");
	dl.appendChild(dt);
	dt.innerHTML = "" //用户头像等信息
	var dd=document.createElement("dd");

	var uinfo = new UserCard(userid?userid:pixiv.context.userId); //创建当前用户信息卡
	
	dlg.uinfo = uinfo;
	dd.appendChild(uinfo);
	dl.appendChild(dd);

	var dt=document.createElement("dt");
	dl.appendChild(dt);
	dt.innerHTML = ""
	var dd=document.createElement("dd");

	var frm = new Frame("下载内容");
	var radio1 = new LabelInput("他的作品","pubd-down-content","pubd-down-content","radio","0",true);
	var radio2 = new LabelInput("他的收藏","pubd-down-content","pubd-down-content","radio","1",true);
	dlg.dcType = [radio1.input,radio2.input];
	radio1.input.onclick = function(){reAnalyse(this)};
	radio2.input.onclick = function(){reAnalyse(this)};
	function reAnalyse(radio)
	{
		if (radio.checked == true)
		{
			if (radio.value == 0)
				dlg.user.bookmarks.break = true; //radio值为0，使收藏中断
			else
				dlg.user.illusts.break = true; //radio值为1，使作品中断

			dlg.analyse(radio.value,dlg.uinfo.userid);
		}
	}
	frm.content.appendChild(radio1);
	frm.content.appendChild(radio2);

	dd.appendChild(frm);
	dl.appendChild(dd);

	var dt=document.createElement("dt");
	dl.appendChild(dt);
	dt.innerHTML = "信息获取进度"
	var dd=document.createElement("dd");
	var progress = new Progress("pubd-downthis-progress");
	dlg.progress = progress;
	dd.appendChild(progress);
	dl.appendChild(dd);

	var dt=document.createElement("dt");
	dl.appendChild(dt);
	dt.innerHTML = "进程日志"
	var dd=document.createElement("dd");
	var ipt = document.createElement("textarea");
	ipt.readOnly = true;
	ipt.className = "pubd-downthis-log";
	ipt.wrap = "off";
	dlg.logTextarea = ipt;
	dd.appendChild(ipt);
	dl.appendChild(dd);

	var dt=document.createElement("dt");
	dl.appendChild(dt);
	dt.innerHTML = "选择下载方案"
	var dd=document.createElement("dd");
	var slt = new Select("pubd-downscheme");
	dlg.downScheme = slt;
	dd.appendChild(slt);
	dl.appendChild(dd);

	//下载按钮栏
	var dt=document.createElement("dt");
	dl.appendChild(dt);
	var dd=document.createElement("dd");
	dd.className = "pubd-downthis-downbar"

	var startdown = document.createElement("input");
	startdown.type = "button";
	startdown.className = "pubd-startdown";
	startdown.value = "开始下载";
	startdown.onclick = function()
	{
		alert("开始下载");
	}
	startdown.disabled = true;
	dlg.startdown = startdown;
	dd.appendChild(startdown);
	dl.appendChild(dd);

	//显示日志相关
	dlg.logArr = []; //用于储存一行一行的日志信息。
	dlg.logClear = function(){
		dlg.logArr.length = 0;
		this.logTextarea.value = "";
	};
	dlg.log = function(text){
		dlg.logArr.push(text);
		this.logTextarea.value = this.logArr.join("\n");
		this.logTextarea.scrollTop = this.logTextarea.scrollHeight;
	};

	function xhrGenneral(url,onload_suceess_Cb,onload_hasError_Cb,onload_notJson_Cb,onerror_Cb)
	{
		var headersObj = new HeadersObject();
		var auth = pubd.auth;
		if (auth.needlogin)
		{
			var token_type = auth.response.token_type.substring(0,1).toUpperCase() + auth.response.token_type.substring(1);
			headersObj.Authorization = token_type + " " + auth.response.access_token;
		}else
		{
			console.info("非登录模式获取信息");
		}
		GM_xmlhttpRequest({
			url:url,
			method:"get",
			responseType:"text",
			headers: headersObj,
			onload: function(response) {
				try
				{
					var jo = JSON.parse(response.responseText);
					if (jo.error)
					{
						console.error("错误：返回错误消息",jo,response);
						//jo.error.message 是JSON字符串的错误信息，Token错误的时候返回的又是普通字符串
						//jo.error.user_message 是单行文本的错误信息
						onload_hasError_Cb(jo);
						//下面开始自动登陆
						if (jo.error.message.indexOf("Error occurred at the OAuth process.")>=0)
						{
							dlg.log("Token过期或错误，需要重新登录");
							if (pubd.auth.save_account)
							{
								dlg.log("检测到已保存账户密码，开始自动登陆");
								var dlgLogin = pubd.dialog.login;
								dlgLogin.show();
								
								pubd.auth.login(
									function(jore){//onload_suceess_Cb
										dlgLogin.error.replace("登陆成功");
										//pubd.dialog.config.start_token_animate();
										dlgLogin.cptBtns.close.click();
										dlg.log("登陆成功");
										//回调自身
										xhrGenneral(url,onload_suceess_Cb,onload_hasError_Cb,onload_notJson_Cb,onerror_Cb);
									},
									function(jore){//onload_haserror_Cb //返回错误消息
										dlgLogin.error.replace(["错误代码：" + jore.errors.system.code,jore.errors.system.message]);
									},
									function(re){//onload_notjson_Cb //返回不是JSON
										dlgLogin.error.replace("返回不是JSON，或程序异常");
									},
									function(re){//onerror_Cb //AJAX发送失败
										dlgLogin.error.replace("AJAX发送失败");
									}
								);
							}
						}
					}else
					{//登陆成功
						console.info("JSON返回成功",jo);
						onload_suceess_Cb(jo);
					}
				}catch(e)
				{
					console.error("错误：返回可能不是JSON，或程序异常",e,response);
					onload_notJson_Cb(response);
				}
			},
			onerror: function(response) {
				console.error("错误：AJAX发送失败",response);
				onerror_Cb(response);
			}
		})
	}

	//分析
	dlg.analyse = function(contentType,userid)
	{
		if(!userid){dlg.log("错误：没有用户ID");return;}
		contentType = contentType==undefined?0:parseInt(contentType);
		var works = contentType==0?dlg.user.illusts:dlg.user.bookmarks; //将需要分析的数据储存到works里

		if(works.runing)
		{
			dlg.log("已经在进行分析操作了");
			return;
		}
		works.break = false;
		works.runing = true;

		dlg.startdown.disabled = true;
		dlg.progress.set(0);
		dlg.logClear();

		function startAnalyseUser(userid,contentType)
		{
			dlg.log("开始获取ID为 " + userid + " 的用户信息");
			xhrGenneral(
				"https://app-api.pixiv.net/v1/user/detail?user_id=" + userid,
				function(jore){//onload_suceess_Cb
					works.runing = true;
					dlg.user.done = true;
					dlg.user.info = Object.assign(dlg.user.info, jore);
					dlg.uinfo.set({
						head:jore.user.profile_image_urls.medium,
						name:jore.user.name,
						illusts:jore.profile.total_illusts + jore.profile.total_manga,
						bookmarks:jore.profile.total_illust_bookmarks_public,
					});
					startAnalyseWorks(dlg.user,contentType); //开始获取第一页
				},
				function(jore){//onload_haserror_Cb //返回错误消息
					dlg.log("错误信息：" + (jore.error.message || jore.error.user_message));
					works.runing = false;
				},
				function(re){//onload_notjson_Cb //返回不是JSON
					dlg.log("错误：返回不是JSON，或程序异常");
					works.runing = false;
				},
				function(re){//onerror_Cb //AJAX发送失败
					dlg.log("错误：AJAX发送失败");
					works.runing = false;
				}
			)
		}

		//根据用户信息是否存在，决定分析用户还是图像
		if (!dlg.user.done)
		{
			startAnalyseUser(userid,contentType);
		}else
		{
			dlg.log("ID：" + userid + " 用户信息已存在");
			startAnalyseWorks(dlg.user,contentType); //开始获取第一页
		}

		//开始分析作品的前置操作
		function startAnalyseWorks(user,contentType)
		{
			var uInfo = user.info;
			var works,total,contentName,apiurl;
			//获取作品,contentType == 0，获取收藏,contentType == 1
			if (contentType==0)
			{
				works = user.illusts;
				total = uInfo.profile.total_illusts + uInfo.profile.total_manga;
				contentName = "作品";
				apiurl = "https://app-api.pixiv.net/v1/user/illusts?user_id=" + uInfo.user.id;
			}else
			{
				works = user.bookmarks;
				total = uInfo.profile.total_illust_bookmarks_public;
				contentName = "收藏";
				apiurl = "https://app-api.pixiv.net/v1/user/bookmarks/illust?user_id=" + uInfo.user.id + "&restrict=public";
			}
			if (works.item.length>0)
			{//断点续传
				dlg.log(contentName + " 断点续传进度 " + works.item.length + "/" + total);
				dlg.progress.set(works.item.length/total); //设置当前下载进度
				apiurl = works.next_url;
			}
			analyseWorks(user,contentType,apiurl); //开始获取第一页
		}
		//分析作品递归函数
		function analyseWorks(user,contentType,apiurl)
		{
			var uInfo = user.info;
			var works,total,contentName;
			if (contentType==0)
			{
				works = user.illusts;
				total = uInfo.profile.total_illusts + uInfo.profile.total_manga;
				contentName = "作品";
			}else
			{
				works = user.bookmarks;
				total = uInfo.profile.total_illust_bookmarks_public;
				contentName = "收藏";
			}
			if (works.done)
			{
				console.log(works);
				//返回所有动图
				var ugoiras = works.item.filter(function(item){
						return item.type == "ugoira";
					})
				if (ugoiras.some(function(item){
					return item.ugoira_metadata == undefined;
				})>0)
				{
					dlg.log("共存在 " + ugoiras.length + " 件动图");
					analyseUgoira(works,ugoiras,function(){ //开始分析动图
						analyseWorks(user,contentType,apiurl) //开始获取下一页
					});
					return;
				}
				//没有动图则继续
				if (works.item.length<total)
					dlg.log("可能因为权限原因，无法获取到所有 " + contentName);
				dlg.log(contentName + " 共 " + works.item.length + " 件已获取完毕，可以开始下载。");
				dlg.progress.set(1);
				works.runing = false;
				works.next_url = "";
				dlg.startdown.disabled = false;
				return;
			}
			if (works.break)
			{
				dlg.log("检测到 " + contentName + " 中断进程命令");
				works.break = false;
				works.runing = false;
				return;
			}

			xhrGenneral(
				apiurl,
				function(jore){//onload_suceess_Cb
					works.runing = true;
					var illusts = jore.illusts;
					for (var ii=0,ii_len=illusts.length;ii<ii_len;ii++)
					{
						var work = illusts[ii];
						var original;
						if (work.page_count>1)
						{/*漫画多图*/
							original = work.meta_pages[0].image_urls.original;
						}else
						{/*单张图片或动图，含漫画单图*/
							original = work.meta_single_page.original_image_url;
						}
						//然后添加扩展名等
						if (work.restrict>0)//非公共权限
							dlg.log(contentName + " " + work.id + " 非公共权限，可能无法正常下载");
						
						works.item.push(work);
					}
					dlg.log(contentName + " 获取进度 " + works.item.length + "/" + total);
					dlg.progress.set(works.item.length/total); //设置当前下载进度
					if (jore.next_url)
					{//还有下一页
						works.next_url = jore.next_url;
					}else
					{//没有下一页
						works.done = true;
					}
					analyseWorks(user,contentType,jore.next_url); //开始获取下一页
				},
				function(jore){//onload_haserror_Cb //返回错误消息
					dlg.log("错误信息：" + (jore.error.message || jore.error.user_message));
					works.runing = false;
				},
				function(re){//onload_notjson_Cb //返回不是JSON
					dlg.log("错误：返回不是JSON，或程序异常");
					works.runing = false;
				},
				function(re){//onerror_Cb //AJAX发送失败
					dlg.log("错误：AJAX发送失败");
					works.runing = false;
				}
			)
		}

		function analyseUgoira(works,ugoirasItems,callback)
		{
			var dealItems = ugoirasItems.filter(function(item){
					return (item.ugoira_metadata == undefined && item.type == "ugoira");
				})
			if (dealItems.length<1)
			{
				dlg.log("动图获取完毕");
				dlg.progress.set(1); //设置当前下载进度
				callback();
				return;
			}
			if (works.break)
			{
				dlg.log("检测到中断进程命令");
				works.break = false;
				works.runing = false;
				return;
			}

			var work = dealItems[0]; //当前处理的图

			xhrGenneral(
				"https://app-api.pixiv.net/v1/ugoira/metadata?illust_id=" + work.id,
				function(jore){//onload_suceess_Cb
					works.runing = true;
					var illusts = jore.illusts;
					work = Object.assign(work,jore);
					dlg.log("动图信息 获取进度 " + (ugoirasItems.length - dealItems.length + 1) + "/" + ugoirasItems.length);
					dlg.progress.set(1-dealItems.length/ugoirasItems.length); //设置当前下载进度
					analyseUgoira(works,ugoirasItems,callback); //开始获取下一项
				},
				function(jore){//onload_haserror_Cb //返回错误消息
					dlg.log("错误信息：" + (jore.error.message || jore.error.user_message));
					if (work.restrict>0)//非公共权限
					{//添加一条空信息
						work.ugoira_metadata = {
							frames:[

							],
							zip_urls:{
								medium:"",
							},
						};
						dlg.log("跳过本条，获取下一条");
						analyseUgoira(works,ugoirasItems,callback); //开始获取下一项
					}
					works.runing = false;
				},
				function(re){//onload_notjson_Cb //返回不是JSON
					dlg.log("错误：返回不是JSON，或程序异常");
					works.runing = false;
				},
				function(re){//onerror_Cb //AJAX发送失败
					dlg.log("错误：AJAX发送失败");
					works.runing = false;
				}
			)
		}
	}

	//启动初始化
	dlg.initialise = function(){
		//var dcType = (GM_getValue("pubd-down-content") == 1)?1:0;
		var dcType = 0;
		if (dlg.user.bookmarks.runing) //如果有程序正在运行，则覆盖设置。
			dcType = 1;
		else if (dlg.user.illusts.runing)
			dcType = 0;
		
		dlg.dcType[dcType].checked = true;
		if (GM_getValue("pubd-autoanalyse"))
			dlg.analyse(dcType,dlg.uinfo.userid);
	};

	return dlg;
}

//开始构建UI
function startBuild(touch,loggedIn)
{
	if (touch) //手机版
	{
		alert("PUBD暂不支持手机版");
	}else
	{
		var btnStartInsertPlace = document.getElementsByClassName("user-relation")[0];
		if (!btnStartInsertPlace) btnStartInsertPlace = document.getElementsByClassName("badges")[0]; //自己的页面
		var btnStartBox = document.createElement("li");
		if (!loggedIn)
		{
			var btnStartInsertPlace = document.getElementsByClassName("introduction")[0];
			var btnStartBox = document.createElement("div");
		}
		pubd.start = buildbtnStart(touch);
		pubd.menu = buildbtnMenu(touch);
		btnStartBox.appendChild(pubd.start);
		btnStartBox.appendChild(pubd.menu);
		btnStartInsertPlace.appendChild(btnStartBox);

		//var btnDlgInsertPlace = document.getElementsByClassName("layout-wrapper")[0] || document.body;
		var btnDlgInsertPlace = document.body;
		pubd.dialog.config = buildDlgConfig(touch);
		btnDlgInsertPlace.appendChild(pubd.dialog.config);
		pubd.dialog.login = buildDlgLogin(touch);
		btnDlgInsertPlace.appendChild(pubd.dialog.login);
		pubd.dialog.downthis = buildDlgDownThis(touch);
		btnDlgInsertPlace.appendChild(pubd.dialog.downthis);

		pubd.auth = new Auth();
		try{
			pubd.auth.loadFromResponse(JSON.parse(GM_getValue("pubd-auth")));
			//pubd.auth.response.access_token = "";
		}catch(e){
			console.error("脚本初始化，读取登录信息失败",e);
		}
	}
}

startBuild(pubd.touch,pubd.loggedIn); //开始主程序