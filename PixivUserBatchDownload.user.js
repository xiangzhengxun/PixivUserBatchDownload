// ==UserScript==
// @name		PixivUserBatchDownload
// @name:zh-CN	P站画师个人作品批量下载工具
// @namespace	http://www.mapaler.com/
// @description	Batch download pixiv user's images in one key.
// @description:zh-CN	一键批量下载P站画师的全部作品
// @include		http://www.pixiv.net/*
// @exclude		http://www.pixiv.net/*mode=manga&illust_id*
// @exclude		http://www.pixiv.net/*mode=big&illust_id*
// @exclude		http://www.pixiv.net/*mode=manga_big*
// @exclude		http://www.pixiv.net/*search.php*
// @version		3.4.2
// @grant		none
// @copyright	2016+, Mapaler <mapaler@163.com>
// @icon		http://www.pixiv.net/favicon.ico
// ==/UserScript==

(function() {
var pICD = 20; //pageIllustCountDefault默认每页作品数量
var Version = 5; //当前设置版本，用于提醒是否需要
var scriptName = typeof(GM_info)!="undefined" ? (GM_info.script.localizedName ? GM_info.script.localizedName : GM_info.script.name) : "PixivUserBatchDownload"; //本程序的名称
var scriptVersion = typeof(GM_info)!="undefined" ? GM_info.script.version : "LocalDebug"; //本程序的版本
var scriptIcon = ((typeof (GM_info) != "undefined") && GM_info.script.icon) ? GM_info.script.icon : "http://www.pixiv.net/favicon.ico"; //本程序的图标
if (!getConfig("PUBD_reset", -1))
{
	ResetConfig(); //新用户重置设置
}
if (getConfig("PUBD_reset", 1) < Version)
{ //老用户提醒更改设置
	alert("3.1版本更改了Desktop.ini的保存设置，可以将%{user_id}掩码从下载目录移回保存路径了（为将来的一些自动化工作做准备），建议重置设置。\r\n因为v3.x仍属于不断开发中，所以重置设置的情况还请谅解。");
	ResetConfig(true);
}

var download_mod = getConfig("PUBD_download_mode",1); //下载模式
var illustPattern = "https?://([^/]+)/.+/(\\d{4})/(\\d{2})/(\\d{2})/(\\d{2})/(\\d{2})/(\\d{2})/((\\d+)(-[0-9a-zA-Z]+)?(?:_p\\d+|_ugoira\\d+x\\d+)?)(?:_\\w+)?\\.([\\w\\d]+)"; //P站图片地址正则匹配式
//var userImagePattern = "https?://([^/]+)/.+/(\w+)/(\\d+)\\.([\\w\\d]+)"; //P站用户头像图片地址正则匹配式

var getPicNum = 0; //Ajax获取了文件的数量
var downOver; //检测下载是否完成的循环函数

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

var dataset =
{
	user_id: 0, //作者ID
	user_pixiv_id: "", //作者账户，可以从作者头像文件获取。
	user_name: "", //作者昵称
	user_head: "", //作者头像url。将来可考虑生成ico保存到文件夹
	illust_count: 0, //作品总数
	illust_file_count: 0, //作品文件总数（含多图）
	illust:[
	],
	desktop_line: "", //%{desktop_line} 每文件输出行的集合
}
function illust()
{
	var obj =
	{
		illust_id: 0, //作品ID
		illust_page: 0, //在作者的第几页
		illust_index: 0, //全部作品中序号
		illust_index_inverted: 0, //全部作品中序号_倒序
		illust_index_in_page: 0, //该页上序号
		illust_index_in_page_inverted: 0, //该页上序号_倒序
		title: "", //作品标题
		type: 0, //类型，单页、漫画、动画
		//type_name: "", //类型用文字表示
		filename: [""], //文件名
		hash: "", //加密字符串
		//page: [0], //第几页（漫画）
		extention: [""], //扩展名
		original_src: [""], //原始图片链接
		page_count: 0, //共几页（漫画）
		year: "",
		month: "",
		day: "",
		hour: "",
		minute: "",
		second: "",

		thumbnail_src: "", //缩略图地址
		domain: "", //域名
		url: "", //作品页面
		time: "", //显示时间
		size: "", //显示大小
		width: 0, //宽
		height: 0, //高
		tools: [""], //使用工具
		caption: "", //说明
		tags: [""], //标签
		//添加作品的顺序
		addIndexFromPage: function (index, page, illcount)
		{
			if (index == undefined)
				index = this.illust_index_in_page;
			else
				this.illust_index_in_page = index;
			if (page == undefined)
				page = this.illust_page;
			else
				this.illust_page = page;
			if (illcount == undefined)
				illcount = dataset.illust_count;
			this.illust_index = (this.illust_page - 1) * pICD + this.illust_index_in_page;
			this.illust_index_inverted = illcount - this.illust_index + 1;
			if ((illcount - this.illust_index) >= pICD)
				this.illust_index_in_page_inverted = pICD - index + 1;
			else
				this.illust_index_in_page_inverted = illcount % pICD - index + 1;
		},
		//从图片地址添加作品
		addDataFromImgSrc: function (src)
		{
			if (src == undefined)
				src = this.thumbnail_src;
			var regSrc = new RegExp(illustPattern, "ig");
			var aImg = regSrc.exec(src);
			this.page_count = 1;
			this.domain = aImg[1];
			this.year = aImg[2];
			this.month = aImg[3];
			this.day = aImg[4];
			this.hour = aImg[5];
			this.minute = aImg[6];
			this.second = aImg[7];
			this.filename[0] = aImg[8];
			this.illust_id = aImg[9];
			this.hash = aImg[10];
			this.extention[0] = aImg[11];
			this.original_src[0] = "http://" + this.domain + "/img-original/img/" +
				this.year + "/" + this.month + "/" + this.day + "/" +
				this.hour + "/" + this.minute + "/" + this.second + "/" +
				this.filename[0] + "." + this.extention[0];
			switch(this.type)
			{
				case 0: //单图
					this.page_count = 1;
					getPicNum++;
					break;
				case 1: //多图
					var mangaUrl = this.url.replace(/mode=[^&]+/, "mode=manga");
					GM_xmlhttpRequest({
						method: "GET",
						url: mangaUrl,
						responseType : "document",
						onload: function(response) {
							dealMangaFast(response.response,obj);
						}
					});
					break;
				case 2: //动图
					this.page_count = 1;
					this.filename[0] += "_ugoira1920x1080";
					this.extention[0] = "zip";
					this.original_src[0] = "http://" + this.domain + "/img-original/img/" +
						this.year + "/" + this.month + "/" + this.day + "/" +
						this.hour + "/" + this.minute + "/" + this.second + "/" +
						this.filename[0] + "." + this.extention[0];
					getPicNum++;
					break;
				case 3: //漫画单图
					this.page_count = 1;
					getPicNum++;
					break;
				default:
			}
		},
		//ajax读取原始页面数据
		ajaxLoad: function (url)
		{
			if (url == undefined)
				url = this.url;
			else
				this.url = url;
			if (this.illust_id < 1)
			{
				var regSrc = /illust_id=(\d+)/ig;
				var iid = regSrc.exec(url);
				if (iid.length >= 2) this.illust_id = iid[1];
			}
			GM_xmlhttpRequest({
				method: "GET",
				url: url,
				responseType : "document",
				onload: function(response) {
					dealIllust(response.response,obj);
				}
			});
		},
	}
	return obj;
}

var menuInsertPlace = document.getElementsByClassName("user-relation")[0];
if (menuInsertPlace == undefined) return;
var li1 = document.createElement("li");
var li2 = document.createElement("li");
menuInsertPlace.appendChild(li1);
menuInsertPlace.appendChild(li2);
li1.className = "ui-selectbox-container";
li2.className = "infoProgress";

var menu_ul = buildMenu();

var btnStart = document.createElement("button");
btnStart.className = "_button following";
btnStart.innerHTML = "获取全部作品";

btnStart.onclick = function (e)
{
	if (menu_ul.parentNode == li1)
		li1.removeChild(menu_ul);
	else
		li1.appendChild(menu_ul);
}
li1.appendChild(btnStart);

//生成设置窗口DOM
var setInsertPlace = document.getElementsByClassName("layout-wrapper")[0] || document.body;
var setWindow = buildSetting();
//生成导出窗口DOM
var exportInsertPlace = setInsertPlace;
var exportWindow = buildExport();
//生成直接链接窗口DOM
var directLinkInsertPlace = setInsertPlace;
var directLinkWindow = buildDirectLink();

//开始程序
function startProgram(mode)
{
	download_mod = getConfig("PUBD_download_mode",1); //重新判断下载模式
	if(getPicNum<1)
	{
		dealUserPage1();
	}
	clearInterval(downOver);
	if (getPicNum > 0 && getPicNum >= dataset.illust_file_count)
	{
		startDownload(mode);
	} else
	{
		downOver = setInterval(function () { startProgramCheck(mode) }, 500);
	}
}

function dealUserPage1(userId)
{
	if (userId == undefined)
	{
		var user_link = document.getElementsByClassName("user-link")[0];
		userId = parseInt(user_link.href.replace(/.+\W+id=(\d+).*/ig, "$1"));
		if(isNaN(userId) && typeof(pixiv) != "undefined" && typeof(pixiv.context) != "undefined" && typeof(pixiv.userId) != "undefined")
			userId = pixiv.context.userId;
    }
	dataset.user_id = userId;

	var locationSearch = (document.location.search.length > 0 ? document.location.search.replace(/mode=\w+/ig, "").replace(/illust_id=\d+/ig, "").replace(/id=\d+/ig, "") : "?");
	var linkPre = document.location.origin + "/member_illust.php" + locationSearch + "&id=" + userId;
	var link = linkPre + "&p=1";

	GM_xmlhttpRequest({
		method: "GET",
		url: link,
		responseType : "document",
		onload: function(response) {
			dealUser(response.response,linkPre,userId);
		}
	});
}
//开始分析本作者
function dealUser(response, linkPre, userId)
{
	//var parser = new DOMParser();
	//PageDOM = parser.parseFromString(response, "text/html");
	PageDOM = response;
	
	var count_badge = PageDOM.getElementsByClassName("count-badge")[0];
	if (!count_badge)
	{
		alert("未发现作品数DOM");
		clearInterval(downOver);
		return;
	}

	var regPC = /(\d+)/ig;
	var photoCount = regPC.exec(count_badge.textContent);

	if (photoCount.length >= 2) {
		dataset.illust_count = parseInt(photoCount[1]);
		if (dataset.illust_count < 1)
		{
			alert("作品数为0");
			clearInterval(downOver);
			return;
		}
		dataset.illust_file_count = dataset.illust_count;
		var pageCount = Math.ceil(dataset.illust_count / 20);
	}
	else
	{
		alert("未发现作品数字符串");
		clearInterval(downOver);
		return;
	}

	var user_link = PageDOM.getElementsByClassName("user-link")[0];
	var user_dom = user_link.getElementsByClassName("user")[0];
	dataset.user_name = user_dom.textContent;

	var userImage = PageDOM.getElementsByClassName("user-image")[0];
	dataset.user_head = userImage?userImage.src:"";
	var tabFeed = PageDOM.getElementsByClassName("tab-feed")[0];
	var regUserFeed = /.+\/([\w\-]+)$/ig; //用户账户正则匹配式，您只可以输入小字母a-z, 数字, 英文破折号(-), 以及英文下划线( _ )
	var regrlt = regUserFeed.exec(tabFeed?tabFeed.getAttribute("href"):"");
	if (regrlt.length>1) dataset.user_pixiv_id = regrlt[1];

	dealPage(response, 1);
	//列表页循环
	for (pi = 2; pi <= pageCount; pi++)
	//for (pi = 0; pi < 1; pi++)
	{
		var link = linkPre + "&p=" +  pi;
		GM_xmlhttpRequest({
			method: "GET",
			url: link,
			responseType : "document",
			onload: function(response) {
				dealPage(response.response,pi);
			}
		});
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

//处理列表页面的回调函数
function dealPage(response, pageIndex)
{
	/*
	老式构建网页dom方法
	var PageDOM = document.createElement("div"); //创建一个容器
	PageDOM.innerHTML = response; //插入代码
	*/

	//var parser = new DOMParser();
	//PageDOM = parser.parseFromString(response, "text/html");
	PageDOM = response;
	
	var _image_items = PageDOM.getElementsByClassName("_image-items");
	if (_image_items.length >= 0)
	{
		var image_items = _image_items[0].getElementsByClassName("image-item");
		//作品循环
		for (ii = 0; ii < image_items.length; ii++)
		//for (ii = 6; ii <= 6; ii++)
		{
			var _thumbnail = image_items[ii].getElementsByClassName("_thumbnail")[0];
			var title = image_items[ii].getElementsByClassName("title")[0];
			var link = image_items[ii].getElementsByTagName("a");

			var ill = new illust;
			if (link[0].href.length < 1)
			{
				console.warn("你的浏览器无法获取DOMParser内a标签的href。目前只有Chrome这么做。")
				var href=link[0].getAttribute("href");
				ill.url = PageDOM.location.origin + (href.indexOf("/")?PageDOM.location.pathname.substring(0,PageDOM.location.pathname.lastIndexOf("/")):"") + "/" + href;
			}
			else
			{
				ill.url = link[0].href;
			}
			ill.title = title.textContent;
			ill.addIndexFromPage(ii + 1, pageIndex, dataset.illust_count);
			ill.thumbnail_src = _thumbnail.src;

			if (image_items[ii].getElementsByClassName("ugoku-illust").length > 0)
				ill.type = 2;
			else if (image_items[ii].getElementsByClassName("multiple").length > 0)
				ill.type = 1;
			else if (image_items[ii].getElementsByClassName("manga").length > 0)
				ill.type = 3;
			else
				ill.type = 0;

			if (download_mod == 1)
			{
				ill.addDataFromImgSrc(ill.thumbnail_src);
			}
			else
			{
				ill.ajaxLoad();
			}
			dataset.illust.push(ill);
		}
	}
}

//处理作品的回调函数
function dealIllust(response, ill)
{
	//var parser = new DOMParser();
	//PageDOM = parser.parseFromString(response, "text/html");
	PageDOM = response;
	
	var regSrc = new RegExp(illustPattern, "ig");
	//work_info
	var work_info = PageDOM.getElementsByClassName("work-info")[0];
	var works_display = PageDOM.getElementsByClassName("works_display")[0];
	//var title = work_info.getElementsByClassName("title")[0];
	//ill.title = title.textContent;
	var caption = work_info.getElementsByClassName("caption")[0];
	if (caption) ill.caption = caption.textContent;
	//metas
	var metas = work_info.getElementsByClassName("meta")[0];
	var meta = metas.getElementsByTagName("li");
	ill.time = meta[0].textContent;
	ill.size = meta[1].textContent;
	var tools = metas.getElementsByClassName("tools")[0]
	if (tools)
	{
		var toolsli = tools.getElementsByTagName("li");
		for (ti = 0; ti < toolsli.length; ti++)
		{
			ill.tools[ti] = toolsli[ti].textContent;

		}
	}
	//TAG
	var tagsDom = PageDOM.getElementsByClassName("work-tags")[0].getElementsByClassName("tags-container")[0].getElementsByClassName("tags");
	if (tagsDom.length > 0)
	{
		var tags = tagsDom[0].getElementsByClassName("tag");
		for (ti = 0; ti < tags.length; ti++)
		{
			ill.tags[ti] = tags[ti].getElementsByClassName("text")[0].textContent;
		}
	}


	var script = PageDOM.getElementById("wrapper").getElementsByTagName("script")[0];
	//建立内部临时变量，避免影响到原始页面
	var pixiv = new Object; pixiv.context = new Object;
	//执行获取到的代码
	eval(script.innerHTML);
	ill.illust_id = pixiv.context.illustId;
	ill.width = pixiv.context.illustSize[0];
	ill.height = pixiv.context.illustSize[1];
	ill.title = pixiv.context.illustTitle;
	//dataset.user_name = pixiv.context.userName;
	//添加静图
	if (PageDOM.getElementsByClassName("original-image")[0]) {//静图
		var originalImage = PageDOM.getElementsByClassName("original-image")[0].getAttribute("data-src");
		ill.page_count = 1;
		ill.type = 0;
		ill.original_src[0] = originalImage;
		var aImg = regSrc.exec(originalImage);
		if (aImg.length >= 1)
		{
			ill.domain = aImg[1];
			ill.year = aImg[2];
			ill.month = aImg[3];
			ill.day = aImg[4];
			ill.hour = aImg[5];
			ill.minute = aImg[6];
			ill.second = aImg[7];
			ill.filename[0] = aImg[8];
			ill.hash = aImg[10];
			ill.extention[0] = aImg[11];
			getPicNum++;
		}else
		{
			alert("获取单图原始图片路径信息失败，可能需要更新正则匹配模式。");

		}
	}
	//添加动图
	else if (PageDOM.getElementsByClassName("_ugoku-illust-player-container").length > 0)
	{
		var zipUrl = pixiv.context.ugokuIllustFullscreenData.src;
		ill.page_count = pixiv.context.ugokuIllustFullscreenData.frames.length;
		ill.type = 2;
		ill.original_src[0] = zipUrl;
		var aImg = regSrc.exec(zipUrl);
		if (aImg.length >= 1) {
			ill.domain = aImg[1];
			ill.year = aImg[2];
			ill.month = aImg[3];
			ill.day = aImg[4];
			ill.hour = aImg[5];
			ill.minute = aImg[6];
			ill.second = aImg[7];
			ill.filename[0] = aImg[8];
			ill.hash = aImg[10];
			ill.extention[0] = aImg[11];
			getPicNum++;
		} else {
			alert("获取动图原始图片路径信息失败，可能需要更新正则匹配模式。");
		}
	}
	//添加多图
	else if (PageDOM.getElementsByClassName("multiple").length > 0)
	{
		ill.type = 1;
		var aImg = regSrc.exec(ill.thumbnail_src);
		if (aImg.length >= 1) {
			ill.domain = aImg[1];
			ill.year = aImg[2];
			ill.month = aImg[3];
			ill.day = aImg[4];
			ill.hour = aImg[5];
			ill.minute = aImg[6];
			ill.second = aImg[7];
			ill.filename[0] = aImg[8];
			ill.hash = aImg[10];
			ill.extention[0] = aImg[11];
		}

		var regPageCont = /.+\s+(\d+)[pP]/ig;
		var rs = regPageCont.exec(ill.size);
		if (rs.length >= 2)
		{
			ill.page_count = parseInt(rs[1]);
			console.info("%s为多图，存在%d张", ill.illust_id, ill.page_count);
			dataset.illust_file_count += ill.page_count - 1; //图片总数里增加多图的张数
			
			var manga_big = ill.url.replace(/mode=[^&]+/, "mode=manga_big");
			var manga_big_url = manga_big + "&page=" + 0;
			
			GM_xmlhttpRequest({
				method: "GET",
				url: manga_big_url,
				responseType : "document",
				onload: function(response) {
					dealManga(response.response,ill);
				}
			});
		}
		else
		{
			alert("获取多图总张数失败");
		}
	}
	//添加漫画
	else if (works_display.getElementsByClassName("manga").length > 0)
	{
		//因为Ajax无法设置Referer，而Mode=big无Referer会跳转回作品信息页面，因此这里只能用现有信息来猜
		var thumbnailImage = works_display.getElementsByClassName("_layout-thumbnail")[0].getElementsByTagName("img")[0];
		ill.page_count = 1;
		ill.type = 3;
		console.info("%s此图为漫画单图，下面开始获取扩展名。", ill.illust_id);

		addFrm(ill);
	}
	else
	{
		alert("未知的作品类型。作品ID：" + ill.illust_id);
	}
}
//通过iframe模式获取扩展名
function addFrm(ill)
{
	var ifrm = document.createElement("iframe");
	ifrm.name = "medium_" + ill.illust_id;
	ifrm.src = ill.url;
	ifrm.style.display = "none";
	if (ifrm.attachEvent)
	{
		ifrm.attachEvent('onload', function () { addBig(self.frames["medium_" + ill.illust_id], ill); });
	} else
	{
		ifrm.onload = function () { addBig(self.frames["medium_" + ill.illust_id], ill); };
	}
	document.body.appendChild(ifrm);
}
function addBig(prt,ill)
{
	var ifrm = prt.document.createElement("iframe");
	ifrm.name = "big_" + ill.illust_id;
	ifrm.src = prt.document.getElementsByClassName("works_display")[0].getElementsByClassName("_work")[0].href;
	if (ifrm.attachEvent)
	{
		ifrm.attachEvent('onload', function ()
		{
			findBig(prt.frames["big_" + ill.illust_id], ill);
		});
	} else
	{
		ifrm.onload = function ()
		{
			findBig(prt.frames["big_" + ill.illust_id], ill);
		};
	}
	prt.document.body.appendChild(ifrm);
}
function findBig(prt, ill)
{
	var finnaly_pic = prt.document.getElementsByTagName("img")[0].src;
	ill.original_src[0] = finnaly_pic;

	var regSrc = new RegExp(illustPattern, "ig");
	var aImg = regSrc.exec(ill.original_src[0]);

	if (aImg.length >= 1)
	{
		ill.domain = aImg[1];
		ill.year = aImg[2];
		ill.month = aImg[3];
		ill.day = aImg[4];
		ill.hour = aImg[5];
		ill.minute = aImg[6];
		ill.second = aImg[7];
		ill.filename[0] = aImg[8];
		ill.hash = aImg[10];
		ill.extention[0] = aImg[11];

		getPicNum++;
		console.info("%s为漫画单图，扩展名为%s", ill.illust_id, ill.extention[0]);
	} else
	{
		alert("获取漫画单图原始图片路径信息失败，可能需要更新正则匹配模式。");

	}

	return finnaly_pic;
}
//处理多图的回调函数
function dealManga(response, ill)
{
	//var parser = new DOMParser();
	//PageDOM = parser.parseFromString(response, "text/html");
	PageDOM = response;
		
	var picture = PageDOM.getElementsByTagName("img")[0];
	ill.original_src[0] = picture.src;
	//var regSrc = /https?:\/\/([^\/]+)\/.+\/(\d{4})\/(\d{2})\/(\d{2})\/(\d{2})\/(\d{2})\/(\d{2})\/((\d+)(?:[\-_][\w\d\-]+)?)\.([\w\d]+)/ig; //P站图片命名规则
	var regSrc = new RegExp(illustPattern, "ig");
	var aImg = regSrc.exec(picture.src);
	if (aImg.length >= 1)
	{
		ill.domain = aImg[1];
		ill.year = aImg[2];
		ill.month = aImg[3];
		ill.day = aImg[4];
		ill.hour = aImg[5];
		ill.minute = aImg[6];
		ill.second = aImg[7];
		ill.filename[0] = aImg[8];
		ill.hash = aImg[10];
		ill.extention[0] = aImg[11];
		getPicNum++;
	} else
	{
		alert("获取多图原始图片信息失败，可能需要更新正则匹配模式。");
	}
	
	for (var mpi = 1; mpi < ill.page_count; mpi++)
	{
		ill.filename[mpi] = ill.filename[0].replace(/_p\d+$/ig, "_p" + mpi);
		ill.extention[mpi] = ill.extention[0];
		ill.original_src[mpi] = ill.original_src[0].replace(ill.filename[0], ill.filename[mpi]);
		getPicNum++;
	}
}

//快速模式处理多图的回调函数
function dealMangaFast(response, ill)
{
	//var parser = new DOMParser();
	//PageDOM = parser.parseFromString(response, "text/html");
	PageDOM = response;
	
	var mangaSec = PageDOM.getElementsByClassName("manga")[0];
	var items = mangaSec.getElementsByClassName("item-container");

	ill.page_count = items.length;
	console.info("%s为多图，存在%d张", ill.illust_id, ill.page_count);

	dataset.illust_file_count += ill.page_count - 1;
	getPicNum++;
	for (var mpi = 1; mpi < ill.page_count; mpi++)
	{
		ill.filename[mpi] = ill.filename[0].replace(/_p\d+$/ig, "_p" + mpi);
		ill.extention[mpi] = ill.extention[0];
		ill.original_src[mpi] = ill.original_src[0].replace(ill.filename[0], ill.filename[mpi]);
		getPicNum++;
	}

}
var ARIA2 = (function () {
	var jsonrpc_version = '2.0';

	function get_auth(url) {
		return url.match(/^(?:(?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(?:\/\/)?(?:([^:@]*(?::[^:@]*)?)?@)?/)[1];
	};

	function request(jsonrpc_path, method, params, priority,callback) {
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

		xhr.open("POST", jsonrpc_path + "?tm=" + (new Date()).getTime().toString(), true);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
		if (auth && auth.indexOf('token:') != 0) {
			xhr.setRequestHeader("Authorization", "Basic " + btoa(auth));
		}
		xhr.send(JSON.stringify(request_obj));
		if (priority) {
			switch(priority)
			{
				case "getVersion":
					xhr.onreadystatechange = function ()  //设置回调函数
					{
						if (xhr.readyState == 4 && xhr.status == 200)
						{
							var JSONreq = JSON.parse(xhr.responseText);
							callback(JSONreq);
						}
						else if (xhr.readyState == 4 && xhr.status != 200)
						{
							callback(false);
						}
					}
					break;
				case "getGlobalOption":
					xhr.onreadystatechange = function ()  //设置回调函数
					{
						if (xhr.readyState == 4 && xhr.status == 200)
						{
							var JSONreq = JSON.parse(xhr.responseText);
							callback(JSONreq);
						}
						else if (xhr.readyState == 4 && xhr.status != 200)
						{
							callback(false);
						}
					}
					break;
			}
		}
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
			request(this.jsonrpc_path, 'aria2.getVersion', [], "getVersion",callback);
		};
		this.getGlobalOption = function (callback) {
			request(this.jsonrpc_path, 'aria2.getGlobalOption', [], "getGlobalOption",callback);
		};
		return this;
	}
})();

var UTF16LE = (function ()
{
	function generateByteArray(str)
	{
		var byteArray = new Uint16Array(str.length + 1);
		byteArray[0] = 0xFEFF;
		for (var i = 0; i < str.length; i++)
		{
			byteArray[i + 1] = str.charCodeAt(i) // & 0xff;
		}
		return byteArray;
	};

	function generateBlob(arr)
	{
		var blob = new Blob([arr]);
		return blob;
	};

	return function (str)
	{
		this.byteArray = generateByteArray(str);
		this.blob = generateBlob(this.byteArray);
		return this;
	}
})();
//生成菜单
function buildMenu()
{
	var menu_ul = document.createElement("ul");
	menu_ul.className = "items";
	//menu_ul.style.display = "none";
	menu_ul.style.display = "block";
	var li = document.createElement("li");
	var a = document.createElement("a");
	a.className = "item";
	a.innerHTML = "Aria2 RPC";
	a.onclick = function () { startProgram(0); li1.removeChild(menu_ul); };
	li.appendChild(a);
	menu_ul.appendChild(li);
	var li = document.createElement("li");
	var a = document.createElement("a");
	a.className = "item";
	a.innerHTML = "导出下载文件";
	a.onclick = function ()
	{
		if (exportWindow.parentNode != exportInsertPlace)
			exportInsertPlace.appendChild(exportWindow);
		li1.removeChild(menu_ul);
		startProgram(1);
	};
	li.appendChild(a);
	menu_ul.appendChild(li);
	var li = document.createElement("li");
	var a = document.createElement("a");
	a.className = "item";
	a.innerHTML = "生成直接链接";
	a.onclick = function ()
	{
		if (directLinkWindow.parentNode != directLinkInsertPlace)
			exportInsertPlace.appendChild(directLinkWindow);
		li1.removeChild(menu_ul);
		startProgram(2);
	};
	li.appendChild(a);
	menu_ul.appendChild(li);
	var li = document.createElement("li");
	li.className = "separated";
	var a = document.createElement("a");
	a.className = "item";
	a.innerHTML = "设置";
	a.onclick = function ()
	{
		if (setWindow.parentNode != setInsertPlace)
			setInsertPlace.appendChild(setWindow);
		li1.removeChild(menu_ul);
	}
	li.appendChild(a);
	menu_ul.appendChild(li);
	return menu_ul;
}
function buildSetting()
{
	var set = document.createElement("div");
	set.id = "PixivUserBatchDownloadSetting";
	set.className = "notification-popup";
	set.style.display = "block";
	//自定义CSS
	var style = document.createElement("style");
	set.appendChild(style);
	style.type = "text/css";
	style.innerHTML +=
		[
			".PUBD_type_name" + "{\r\n" + [
				'width:120px',
			].join(';\r\n') + "\r\n}",
			".PUBD_PRC_path" + "{\r\n" + [
				'width:180px' ,
			].join(';') + "\r\n}",
			".full_text_width" + "{\r\n" + [
				'width:340px' ,
				'min-width:340px' ,
				'max-width:340px' ,
			].join(';') + "\r\n}",
			"#PixivUserBatchDownloadSetting .thread" + "{\r\n" + [
				'margin:0',
				'height:35px',
				'padding-left:5px',
			].join(';') + "\r\n}",
			"#PixivUserBatchDownloadSetting .type_name" + "{\r\n" + [
				'height:60px',
			].join(';') + "\r\n}",
			"#PixivUserBatchDownloadSetting .download_mode" + "{\r\n" + [
				'height:45px',
			].join(';') + "\r\n}",
			"#PixivUserBatchDownloadSetting .text" + "{\r\n" + [
				'height:4em',
				'margin-right:0',
			].join(';') + "\r\n}",
			"#PixivUserBatchDownloadSetting .desktop" + "{\r\n" + [
				'height:240px',
			].join(';') + "\r\n}",
			"#PixivUserBatchDownloadSetting .desktop .text" + "{\r\n" + [
				'height:240px',
			].join(';') + "\r\n}",
			".PUBD_desktop_main" + "{\r\n" + [
				'height:150px',
				'min-height:150px',
				'max-height:150px',
			].join(';') + "\r\n}",
			".desktop_readme" + "{\r\n" + [
				'float:right',
			].join(';') + "\r\n}",
		].join('\r\n');


	//标题行
	var h2 = document.createElement("h2");
	h2.innerHTML = scriptName + " v" + scriptVersion;

	h2.appendChild(document.createElement("br"));
	var a = document.createElement("a");
	a.className = "_official-badge";
	a.innerHTML = "使用说明";
	a.href = "https://github.com/Mapaler/PixivUserBatchDownload/tree/develop";
	a.target = "_blank";
	h2.appendChild(a);
	var a = document.createElement("a");
	a.className = "_official-badge";
	a.innerHTML = "反馈";
	a.href = "https://github.com/Mapaler/PixivUserBatchDownload/issues";
	a.target = "_blank";
	h2.appendChild(a);
	//设置内容
	var ul = document.createElement("ul");
	ul.className = "notification-list message-thread-list";
	
	//设置-模式
	var li = document.createElement("li");
	li.className = "thread download_mode";
	var divTime = document.createElement("div");
	divTime.className = "time date";
	var divName = document.createElement("div");
	divName.className = "name";
	var divText = document.createElement("div");
	divText.className = "text";
	li.appendChild(divTime);
	li.appendChild(divName);
	li.appendChild(divText);
	ul.appendChild(li);

	divName.innerHTML = "分析模式";
	divTime.innerHTML = "选择是否获得文件的准确扩展名"

	var ipt = document.createElement("input");
	ipt.type = "radio";
	ipt.value = 0;
	if (download_mod == ipt.value) ipt.setAttribute('checked', 'true');
	ipt.name = "PUBD_download_mode";
	ipt.id = ipt.name + ipt.value;
	var lbl = document.createElement("label");
	lbl.innerHTML = "准确模式（分析扩展名）";
	lbl.setAttribute('for', ipt.id);
	divText.appendChild(ipt);
	divText.appendChild(lbl);

	divText.appendChild(document.createElement("br"));

	var ipt = document.createElement("input");
	ipt.type = "radio";
	ipt.value = 1;
	if (download_mod == ipt.value) ipt.setAttribute('checked', 'true');
	ipt.name = "PUBD_download_mode";
	ipt.id = ipt.name + ipt.value;
	var lbl = document.createElement("label");
	lbl.innerHTML = "快速模式（直接生成3种可能的扩展名，无法获取作品介绍）";
	lbl.setAttribute('for', ipt.id);
	divText.appendChild(ipt);
	divText.appendChild(lbl);

	//设置-RPC Path
	var li = document.createElement("li");
	li.className = "thread";
	var divTime = document.createElement("div");
	divTime.className = "time date";
	var divName = document.createElement("div");
	divName.className = "name";
	var divText = document.createElement("div");
	divText.className = "text";
	li.appendChild(divTime);
	li.appendChild(divName);
	li.appendChild(divText);
	ul.appendChild(li);

	divName.innerHTML = "Aria2 JSON-RPC Path";
	divTime.innerHTML = "填写Aria2 JSON-RPC地址"
	var ipt = document.createElement("input");
	ipt.type = "text";
	ipt.className = "PUBD_PRC_path";
	ipt.name = "PUBD_PRC_path";
	ipt.id = ipt.name;
	ipt.value = getConfig("PUBD_PRC_path");
	divText.appendChild(ipt);
	var btnCheckLink = document.createElement("button");
	btnCheckLink.className = "_button";
	btnCheckLink.name = "PUBD_PRC_path_check";
	btnCheckLink.innerHTML = "检测地址";
	btnCheckLink.onclick = function ()
	{
		this.innerHTML = "正在连接...";
		//spawnNotification("正在连接Aria2...", scriptIcon, scriptName);
		var aria2 = new ARIA2(document.getElementsByName("PUBD_PRC_path")[0].value);
		aria2.getVersion(function (rejson){
			var checkBtn = document.getElementsByName("PUBD_PRC_path_check")[0];
			if (rejson)
				checkBtn.innerHTML="发现Aria2 ver" + rejson.result.version;
			else
				checkBtn.innerHTML="Aria2连接失败";
		});
	}
	divText.appendChild(btnCheckLink);
	//设置-下载目录
	var li = document.createElement("li");
	li.className = "thread";
	var divTime = document.createElement("div");
	divTime.className = "time date";
	var divName = document.createElement("div");
	divName.className = "name";
	var divText = document.createElement("div");
	divText.className = "text";
	li.appendChild(divTime);
	li.appendChild(divName);
	li.appendChild(divText);
	ul.appendChild(li);

	divName.innerHTML = "下载目录";
	divTime.innerHTML = "下载主目录绝对路径，留空使用Aria2默认路径"
	var ipt = document.createElement("input");
	ipt.type = "text";
	ipt.className = "PUBD_save_dir full_text_width";
	ipt.name = "PUBD_save_dir";
	ipt.id = ipt.name;
	ipt.value = getConfig("PUBD_save_dir");
	divText.appendChild(ipt);
	//设置-图片网址
	var li = document.createElement("li");
	li.className = "thread";
	var divTime = document.createElement("div");
	divTime.className = "time date";
	var divName = document.createElement("div");
	divName.className = "name";
	var divText = document.createElement("div");
	divText.className = "text";
	li.appendChild(divTime);
	li.appendChild(divName);
	li.appendChild(divText);
	ul.appendChild(li);

	divName.innerHTML = "图片网址";
	divTime.innerHTML = "下载的图片文件地址"
	var ipt = document.createElement("input");
	ipt.type = "text";
	ipt.className = "PUBD_image_src full_text_width";
	ipt.name = "PUBD_image_src";
	ipt.id = ipt.name;
	ipt.value = getConfig("PUBD_image_src");
	divText.appendChild(ipt);
	//设置-下载路径
	var li = document.createElement("li");
	li.className = "thread";
	var divTime = document.createElement("div");
	divTime.className = "time date";
	var divName = document.createElement("div");
	divName.className = "name";
	var divText = document.createElement("div");
	divText.className = "text";
	li.appendChild(divTime);
	li.appendChild(divName);
	li.appendChild(divText);
	ul.appendChild(li);

	divName.innerHTML = "保存路径";
	divTime.innerHTML = "分组保存的文件夹和文件名"
	var ipt = document.createElement("input");
	ipt.type = "text";
	ipt.className = "PUBD_save_path full_text_width";
	ipt.name = "PUBD_save_path";
	ipt.id = ipt.name;
	ipt.value = getConfig("PUBD_save_path");
	divText.appendChild(ipt);
	//设置-referer（引用）地址
	var li = document.createElement("li");
	li.className = "thread";
	var divTime = document.createElement("div");
	divTime.className = "time date";
	var divName = document.createElement("div");
	divName.className = "name";
	var divText = document.createElement("div");
	divText.className = "text";
	li.appendChild(divTime);
	li.appendChild(divName);
	li.appendChild(divText);
	ul.appendChild(li);

	divName.innerHTML = "引用页面";
	divTime.innerHTML = "Referer，访问来源页面地址"
	var ipt = document.createElement("input");
	ipt.type = "text";
	ipt.className = "PUBD_referer full_text_width";
	ipt.name = "PUBD_referer";
	ipt.id = ipt.name;
	ipt.value = getConfig("PUBD_referer");
	divText.appendChild(ipt);
	//设置-类型命名
	var li = document.createElement("li");
	li.className = "thread type_name";
	var divTime = document.createElement("div");
	divTime.className = "time date";
	var divName = document.createElement("div");
	divName.className = "name";
	var divText = document.createElement("div");
	divText.className = "text";
	li.appendChild(divTime);
	li.appendChild(divName);
	li.appendChild(divText);
	ul.appendChild(li);

	divName.innerHTML = "类型命名";
	divTime.innerHTML = "%{type_name}的内容"

	var ipt = document.createElement("input");
	ipt.type = "text";
	ipt.className = "PUBD_type_name";
	ipt.name = "PUBD_type_name0";
	ipt.id = ipt.name;
	ipt.value = getConfig("PUBD_type_name0");
	var lbl = document.createElement("label");
	lbl.innerHTML = "单图：";
	lbl.setAttribute('for', ipt.id);
	divText.appendChild(lbl);
	divText.appendChild(ipt);

	var ipt = document.createElement("input");
	ipt.type = "text";
	ipt.className = "PUBD_type_name";
	ipt.name = "PUBD_type_name1";
	ipt.id = ipt.name;
	ipt.value = getConfig("PUBD_type_name1");
	var lbl = document.createElement("label");
	lbl.innerHTML = "多图：";
	lbl.setAttribute('for', ipt.id);
	divText.appendChild(lbl);
	divText.appendChild(ipt);

	divText.appendChild(document.createElement("br"));

	var ipt = document.createElement("input");
	ipt.type = "text";
	ipt.className = "PUBD_type_name";
	ipt.name = "PUBD_type_name2";
	ipt.id = ipt.name;
	ipt.value = getConfig("PUBD_type_name2");
	var lbl = document.createElement("label");
	lbl.innerHTML = "动图：";
	lbl.setAttribute('for', ipt.id);
	divText.appendChild(lbl);
	divText.appendChild(ipt);

	var ipt = document.createElement("input");
	ipt.type = "text";
	ipt.className = "PUBD_type_name";
	ipt.name = "PUBD_type_name3";
	ipt.id = ipt.name;
	ipt.value = getConfig("PUBD_type_name3");
	var lbl = document.createElement("label");
	lbl.innerHTML = "单漫：";
	lbl.setAttribute('for', ipt.id);
	divText.appendChild(lbl);
	divText.appendChild(ipt);
	//设置-多图掩码
	var li = document.createElement("li");
	li.className = "thread";
	var divTime = document.createElement("div");
	divTime.className = "time date";
	var divName = document.createElement("div");
	divName.className = "name";
	var divText = document.createElement("div");
	divText.className = "text";
	li.appendChild(divTime);
	li.appendChild(divName);
	li.appendChild(divText);
	ul.appendChild(li);

	divName.innerHTML = "多图掩码内容";
	divTime.innerHTML = "替换%{multiple}的内容"
	var ipt = document.createElement("input");
	ipt.type = "text";
	ipt.className = "PUBD_multiple_mask full_text_width";
	ipt.name = "PUBD_multiple_mask";
	ipt.id = ipt.name;
	ipt.value = getConfig("PUBD_multiple_mask");
	divText.appendChild(ipt);

	//设置-Desktop.ini
	var li = document.createElement("li");
	li.className = "thread desktop";
	var divTime = document.createElement("div");
	divTime.className = "time date";
	var divName = document.createElement("div");
	divName.className = "name";
	var divText = document.createElement("div");
	divText.className = "text";
	li.appendChild(divTime);
	li.appendChild(divName);
	li.appendChild(divText);
	ul.appendChild(li);

	divName.innerHTML = "自定义文件夹";
	divTime.innerHTML = "文件夹图标改为头像，名称改为作者昵称"

	var lnk = document.createElement("a");
	lnk.className = "desktop_readme";
	lnk.innerHTML = "功能使用说明";
	lnk.href = "https://github.com/Mapaler/PixivUserBatchDownload/tree/develop/Customize_Folder";
	lnk.target = "_blank";
	divText.appendChild(lnk);
	
	var ipt = document.createElement("input");
	ipt.type = "checkbox";
	ipt.className = "PUBD_desktop";
	ipt.name = "PUBD_desktop";
	ipt.id = ipt.name;
	ipt.value = 1;
	ipt.onclick = function ()
	{
		document.getElementsByName("PUBD_desktop_main")[0].disabled = !this.checked;
		document.getElementsByName("PUBD_desktop_line")[0].disabled = !this.checked;
	}
	if (getConfig("PUBD_desktop", 1)) ipt.setAttribute('checked', 'true');
	var lbl = document.createElement("label");
	lbl.setAttribute('for', ipt.id);
	lbl.innerHTML = "启用（仅RPC模式）";
	divText.appendChild(ipt);
	divText.appendChild(lbl);

	divText.appendChild(document.createElement("br"));

	var txt = document.createElement("textarea");
	txt.className = "PUBD_desktop_main full_text_width";
	txt.name = "PUBD_desktop_main";
	txt.id = txt.name;
	if (!getConfig("PUBD_desktop", 1)) txt.setAttribute('disabled', 'true');
	txt.value = getConfig("PUBD_desktop_main");
	txt.wrap = "off";

	var lbl = document.createElement("label");
	lbl.setAttribute('for', txt.id);
	lbl.innerHTML = "Desktop.ini文件主要格式";
	divText.appendChild(lbl);
	divText.appendChild(document.createElement("br"));
	divText.appendChild(txt);

	divText.appendChild(document.createElement("br"));

	var ipt = document.createElement("input");
	ipt.type = "text";
	ipt.className = "PUBD_desktop_line full_text_width";
	ipt.name = "PUBD_desktop_line";
	ipt.id = ipt.name;
	if (!getConfig("PUBD_desktop", 1)) ipt.setAttribute('disabled', 'true');
	ipt.value = getConfig("PUBD_desktop_line");

	var lbl = document.createElement("label");
	lbl.setAttribute('for', ipt.id);
	lbl.innerHTML = "尾端的每文件格式（%{desktop_line}）";
	divText.appendChild(lbl);
	divText.appendChild(document.createElement("br"));
	divText.appendChild(ipt);

	//确定按钮行
	var confirmbar = document.createElement("div");
	confirmbar.className = "_notification-request-permission";
	confirmbar.style.display = "block";
	var btnConfirm = document.createElement("button");
	btnConfirm.className = "_button";
	btnConfirm.title = "OK";
	btnConfirm.innerHTML = "确定";
	var btnCancel = document.createElement("button");
	btnCancel.className = "_button";
	btnCancel.title = "Cancel";
	btnCancel.innerHTML = "取消";
	btnCancel.onclick = function () { set.parentNode.removeChild(set); }
	var btnReset = document.createElement("button");
	btnReset.className = "_button";
	btnReset.title = "Reset";
	btnReset.innerHTML = "重置设置";
	btnReset.onclick = function () { ResetConfig(); }
	confirmbar.appendChild(btnConfirm);
	confirmbar.appendChild(btnCancel);
	confirmbar.appendChild(btnReset);

	set.appendChild(h2);
	set.appendChild(ul);
	set.appendChild(confirmbar);

	btnConfirm.onclick = function ()
	{
		setConfig("PUBD_reset", Version);
		var radioObj = document.getElementsByName("PUBD_download_mode");
		for (var oi = 0; oi < radioObj.length; oi++)
		{
			if (radioObj[oi].checked)
			{
				setConfig("PUBD_download_mode", oi); //radioObj[oi].value
				break;
			}
		}
		setConfig("PUBD_PRC_path", document.getElementsByName("PUBD_PRC_path")[0].value);
		setConfig("PUBD_save_dir", document.getElementsByName("PUBD_save_dir")[0].value);
		setConfig("PUBD_image_src", document.getElementsByName("PUBD_image_src")[0].value);
		setConfig("PUBD_save_path", document.getElementsByName("PUBD_save_path")[0].value);
		setConfig("PUBD_referer", document.getElementsByName("PUBD_referer")[0].value);
		setConfig("PUBD_type_name0", document.getElementsByName("PUBD_type_name0")[0].value);
		setConfig("PUBD_type_name1", document.getElementsByName("PUBD_type_name1")[0].value);
		setConfig("PUBD_type_name2", document.getElementsByName("PUBD_type_name2")[0].value);
		setConfig("PUBD_type_name3", document.getElementsByName("PUBD_type_name3")[0].value);
		setConfig("PUBD_multiple_mask", document.getElementsByName("PUBD_multiple_mask")[0].value);
		setConfig("PUBD_desktop", document.getElementsByName("PUBD_desktop")[0].value);
		setConfig("PUBD_desktop_main", document.getElementsByName("PUBD_desktop_main")[0].value);
		setConfig("PUBD_desktop_line", document.getElementsByName("PUBD_desktop_line")[0].value);

		spawnNotification("设置已保存", scriptIcon, scriptName);
		btnCancel.onclick();
	}

	return set;
}

//生成导出下载窗口
function buildExport() {
	var set = document.createElement("div");
	set.id = "PixivUserBatchDownloadExport";
	set.className = "notification-popup";
	set.style.display = "block";
	//自定义CSS
	var style = document.createElement("style");
	set.appendChild(style);
	style.type = "text/css";
	style.innerHTML +=
		[
			".PUBD_batch" + "{\r\n" + [
				'width:350px',
				'max-width:350px',
				'min-width:350px',
				'height:300px',
			].join(';\r\n') + "\r\n}",
		].join('\r\n');

	//标题行
	var h2 = document.createElement("h2");
	h2.innerHTML = "Aria2导出";

	//设置内容
	var ul = document.createElement("ul");
	ul.className = "notification-list message-thread-list";

	//导出-Batch
	var li = document.createElement("li");
	//li.className = "thread";
	//var divTime = document.createElement("div");
	//divTime.className = "time date";
	var divName = document.createElement("div");
	divName.className = "name";
	var divText = document.createElement("div");
	divText.className = "text";
	//li.appendChild(divTime);
	li.appendChild(divName);
	li.appendChild(divText);
	ul.appendChild(li);

	divName.innerHTML = "命令行提示符批处理";
	//divTime.innerHTML = "保存为bat文件运行"
	var txt = document.createElement("textarea");
	txt.className = "PUBD_batch";
	txt.name = "PUBD_batch";
	txt.wrap = "off";
	divText.appendChild(txt);

	//导出-Down
	var li = document.createElement("li");
	//li.className = "thread";
	//var divTime = document.createElement("div");
	//divTime.className = "time date";
	//var divName = document.createElement("div");
	//divName.className = "name";
	var divText = document.createElement("div");
	divText.className = "text";
	//li.appendChild(divTime);
	//li.appendChild(divName);
	li.appendChild(divText);
	ul.appendChild(li);

	//divName.innerHTML = "下载命令";
	//divTime.innerHTML = "保存为bat文件运行"
	var btnExport = document.createElement("a");
	btnExport.className = "_button";
	btnExport.name = "PUBD_down";
	btnExport.target = "_blank"
	btnExport.download = "aria2" + ".session.txt"
	btnExport.innerHTML = "导出Aria2会话文件";
	//btnExport.onclick = function () { startProgram(2); }
	divText.appendChild(btnExport);

	//确定按钮行
	var confirmbar = document.createElement("div");
	confirmbar.className = "_notification-request-permission";
	confirmbar.style.display = "block";
	var btnClose = document.createElement("button");
	btnClose.className = "_button";
	btnClose.innerHTML = "关闭";
	btnClose.onclick = function () { set.parentNode.removeChild(set); }

	confirmbar.appendChild(btnClose);

	set.appendChild(h2);
	set.appendChild(ul);
	set.appendChild(confirmbar);
	return set;
}

//生成直接下载链接窗口
function buildDirectLink()
{
	var set = document.createElement("div");
	set.id = "PixivUserBatchDownloadDirectLink";
	set.className = "notification-popup";
	set.style.display = "block";
	//自定义CSS
	var style = document.createElement("style");
	set.appendChild(style);
	style.type = "text/css";
	style.innerHTML +=
		[
			".PUBD_dLink" + "{\r\n" + [
				'width:100%',
				'height:300px',
				'overflow:scroll',
				'border:1px solid #becad8',
			].join(';\r\n') + "\r\n}",
			"#PixivUserBatchDownloadDirectLink a" + "{\r\n" + [
				'display:inline',
				'padding:0',
				'background:none',
				'color:	#258fb8',
				'white-space:nowrap',
			].join(';\r\n') + "\r\n}",
		].join('\r\n');

	//标题行
	var h2 = document.createElement("h2");
	h2.innerHTML = "直接下载链接";

	//设置内容
	var ul = document.createElement("ul");
	ul.className = "notification-list message-thread-list";

	//导出-Batch
	var li = document.createElement("li");
	//li.className = "thread";
	//var divTime = document.createElement("div");
	//divTime.className = "time date";
	var divName = document.createElement("div");
	divName.className = "name";
	var divText = document.createElement("div");
	divText.className = "text";
	//li.appendChild(divTime);
	li.appendChild(divName);
	li.appendChild(divText);
	ul.appendChild(li);

	divName.innerHTML = "用<a href=\"https://addons.mozilla.org/firefox/addon/downthemall/\" target=\"_blank\">DownThemAll!</a>的批量下载，重命名掩码设置为“*title*”<br />" +
		"如果发生403错误，使用<a href=\"https://addons.mozilla.org/firefox/addon/referrer-control/\" target=\"_blank\">RefControl</a>添加站点“pixiv.net”，设置“伪装-发送站点根目录”";
	//divTime.innerHTML = "保存为bat文件运行"
	var ipt = document.createElement("div");
	ipt.className = "PUBD_dLink";
	divText.appendChild(ipt);

	//确定按钮行
	var confirmbar = document.createElement("div");
	confirmbar.className = "_notification-request-permission";
	confirmbar.style.display = "block";
	var btnClose = document.createElement("button");
	btnClose.className = "_button";
	btnClose.innerHTML = "关闭";
	btnClose.onclick = function () { set.parentNode.removeChild(set); }

	confirmbar.appendChild(btnClose);

	set.appendChild(h2);
	set.appendChild(ul);
	set.appendChild(confirmbar);
	return set;
}

//检测下载完成情况
function startProgramCheck(mode) {
	if (getPicNum > 0 && getPicNum >= dataset.illust_file_count) {
		li2.innerHTML = "获取完成：" + getPicNum + "/" + dataset.illust_file_count;
		if (mode != 0) spawnNotification(dataset.user_name + " 的作品解析完成", dataset.user_head, scriptName);
		clearInterval(downOver);
		startDownload(mode);
	}
	else
	{
		li2.innerHTML = "已获取图像地址：" + getPicNum + "/" + dataset.illust_file_count;
		var PUBD_batch = document.getElementsByName("PUBD_batch")[0];
		if (PUBD_batch) PUBD_batch.value = li2.innerHTML;
		var PUBD_dLink = document.getElementsByClassName("PUBD_dLink")[0];
		if (PUBD_dLink) PUBD_dLink.innerHTML = li2.innerHTML;
	}
	console.debug("获取%d/%d",getPicNum, dataset.illust_file_count);
}
//开始构建下载
function startDownload(mode) {
	switch (mode)
	{
		case 0: //RPC模式

			var aria2 = new ARIA2(getConfig("PUBD_PRC_path"));
			if (getConfig("PUBD_desktop", 1))
			{
				aria2.getGlobalOption(function(json){
					if(json)
						down_RPC(json);
					else
						spawnNotification("Aria2设置获取失败，请检查连接", scriptIcon, scriptName);
				});
			}else
			{
				down_RPC(false);
			}
			break;
		case 1: //生成BAT下载命令模式
			var txt = "";
			var downtxt = "";
			for (var ii = 0; ii < dataset.illust.length; ii++)
			{
				var ill = dataset.illust[ii];
				for (var pi = 0; pi < ill.original_src.length; pi++)
				{
					var ext = ill.extention[pi];
					for (var dmi = 0; dmi < ((download_mod == 1 && ill.type != 2) ? 3 : 1) ; dmi++)
					{
						txt += "aria2c --out=\"" + replacePathSafe(showMask(getConfig("PUBD_save_path"), ill, pi, replacePathSafe), true) + "\" --referer=\"" + showMask(getConfig("PUBD_referer"), ill, pi) + "\" --allow-overwrite=false --auto-file-renaming=false --remote-time=true " + ((getConfig("PUBD_save_dir").length > 0) ? "--dir=\"" + replacePathSafe(showMask(getConfig("PUBD_save_dir"), ill, pi, replacePathSafe), true) + "\" " : "") + "\"" + showMask(getConfig("PUBD_image_src"), ill, pi) + "\"";
						downtxt += showMask(getConfig("PUBD_image_src"), ill, pi)
							+ ((getConfig("PUBD_save_dir").length > 0) ? "\r\n dir=" + replacePathSafe(showMask(getConfig("PUBD_save_dir"), ill, pi, replacePathSafe), true) : "")
							+ "\r\n out=" + replacePathSafe(showMask(getConfig("PUBD_save_path"), ill, pi, replacePathSafe), true)
							+ "\r\n referer=" + showMask(getConfig("PUBD_referer"), ill, pi)
							+ "\r\n allow-overwrite=false"
							+ "\r\n auto-file-renaming=false"
							+ "\r\n remote-time=true"
						;
						txt += "\r\n";
						downtxt += "\r\n";
						//快速模式重新更改扩展名
						if (download_mod == 1)
						{
							switch (dmi)
							{
								case 0:
									ill.extention[pi] = ext == "jpg" ? "png" : "jpg";
									break;
								case 1:
									ill.extention[pi] = ext != "gif" ? "gif" : "png";
									break;
								case 2:
									ill.extention[pi] = ext; //操作完还原
									break;
								default:
							}
							ill.original_src[pi] = ill.original_src[0].replace(/\.\w+$/, "." + ill.extention[pi]);
						}
					}
				}
			}
			var txta = document.getElementsByName("PUBD_batch")[0];
			var btn = document.getElementsByName("PUBD_down")[0];
			if (txta) txta.value = txt;
			var downBlob = new Blob([downtxt], {'type': 'text\/plain'});
			var downurl = window.URL.createObjectURL(downBlob);//"data:text/plain;charset=utf-8," + encodeURIComponent(downtxt);
			if (btn)
			{
				btn.href = downurl;
				btn.download = dataset.user_id + "_" + dataset.user_name + ".session.txt"
			}
			break;
		case 2: //生成直接下载链接模式
			var linksDom = document.getElementsByClassName("PUBD_dLink")[0];
			linksDom.innerHTML = "";
			for (var ii = 0; ii < dataset.illust.length; ii++)
			{
				var ill = dataset.illust[ii];
				for (var pi = 0; pi < ill.original_src.length; pi++)
				{
					var ext = ill.extention[pi];
					for (var dmi = 0; dmi < ((download_mod == 1 && ill.type != 2) ? 3 : 1) ; dmi++)
					{
						var dlink = document.createElement("a");
						var br = document.createElement("br");
						dlink.href = showMask(getConfig("PUBD_image_src"), ill, pi);
						dlink.title = replacePathSafe(showMask(getConfig("PUBD_save_path"), ill, pi, replacePathSafe), true);
						dlink.innerHTML = dlink.title; //showMask("%{illust_id}_%{title}_p%{page}", ill, pi);
						linksDom.appendChild(dlink);
						linksDom.appendChild(br);
						//快速模式重新更改扩展名
						if (download_mod == 1)
						{
							switch (dmi)
							{
								case 0:
									ill.extention[pi] = ext == "jpg" ? "png" : "jpg";
									break;
								case 1:
									ill.extention[pi] = ext != "gif" ? "gif" : "png";
									break;
								case 2:
									ill.extention[pi] = ext; //操作完还原
									break;
								default:
							}
							ill.original_src[pi] = ill.original_src[0].replace(/\.\w+$/, "." + ill.extention[pi]);
						}
					}
				}
			}
			break;
		default:
			alert("未知的下载模式");
			break;
	}
};
function down_RPC(option) {
	var aria2 = new ARIA2(getConfig("PUBD_PRC_path"));
	var PUBD_desktop = getConfig("PUBD_desktop", 1); //是否打开desktop.ini生成

	var desktopDir = "";

	dataset.desktop_line = "";
	for (var ii = 0; ii < dataset.illust.length; ii++) {
		var ill = dataset.illust[ii];
		for (var pi = 0; pi < ill.original_src.length; pi++)
		{
			var ext = ill.extention[pi];
			for (var dmi = 0; dmi < ((download_mod == 1 && ill.type != 2) ? 3 : 1) ; dmi++)
			{
				if (PUBD_desktop)
				{
					dataset.desktop_line += showMask(getConfig("PUBD_desktop_line"), ill, pi);
					dataset.desktop_line += "\r\n";
				}
				var srtObj = {
					"out": replacePathSafe(showMask(getConfig("PUBD_save_path"), ill, pi, replacePathSafe), true),
					"referer": showMask(getConfig("PUBD_referer"), ill, pi),
				}
				if(getConfig("PUBD_save_dir").length>0)
				{
					srtObj.dir = replacePathSafe(showMask(getConfig("PUBD_save_dir"), ill, pi, replacePathSafe), true);
				}
				aria2.addUri(showMask(getConfig("PUBD_image_src"), ill, pi), srtObj);

				if (PUBD_desktop && !desktopDir && ill.type != 1) //当desktopDir为空，且不为多图则执行。获取desktop应该存放的地点
				{
					var dirTmp = srtObj.dir || option.result.dir || "";
					//获取一个文件的完整路径
					var fullSavePath = dirTmp + ((dirTmp.lastIndexOf("\\") == (dirTmp.length - 1) || dirTmp.lastIndexOf("/") == (dirTmp.length - 1)) ? "" : "/") + srtObj.out;
					//只保留最后一个斜杠前的
					desktopDir = fullSavePath.replace(/^(.+)[\\/]+[^\\/]+/ig, "$1");
				}
				//快速模式重新更改扩展名
				if (download_mod == 1)
				{
					switch (dmi)
					{
						case 0:
							ill.extention[pi] = ext == "jpg" ? "png" : "jpg";
							break;
						case 1:
							ill.extention[pi] = ext != "gif" ? "gif" : "png";
							break;
						case 2:
							ill.extention[pi] = ext; //操作完还原
							break;
						default:
					}
					ill.original_src[pi] = ill.original_src[0].replace(/\.\w+$/, "." + ill.extention[pi]);
				}
			}
		}
	}
	if (PUBD_desktop && !desktopDir) //如果前面的图全部不符合条件（也就是全等于多图，那只好用最后一张图了）
	{
		var dirTmp = srtObj.dir || option.result.dir || "";
		//获取最后一个文件的完整路径
		var fullSavePath = srtObj.dir + ((srtObj.dir.lastIndexOf("\\") == (srtObj.dir.length - 1) || srtObj.dir.lastIndexOf("/") == (srtObj.dir.length - 1)) ? "" : "/") + srtObj.out;
		//只保留最后一个斜杠前的
		desktopDir = fullSavePath.replace(/^(.+)[\\/]+[^\\/]+/ig, "$1");
	}
	if (PUBD_desktop)
	{
		var srtObj = {
			"out": "head.image",
			"referer": showMask("%{user_head}"),
			"follow-torrent": "true",
			"dir": desktopDir,
		}
		aria2.addUri(showMask("%{user_head}"), srtObj);

		var desktopTxt = showMask(getConfig("PUBD_desktop_main"));
		//desktopTxt = desktopTxt.replace("%{desktop_line}", desktop_line);

		var txtblod = new UTF16LE(desktopTxt);
		var reader = new FileReader();
		reader.onload = function (res)
		{
			var txt = res.target.result;
			aria2.addTorrent(txt.split(',')[1], srtObj);
		};
		
		reader.readAsDataURL(txtblod.blob);
	}

	spawnNotification(dataset.user_name + " 的作品下载链接已发送到Aria2", dataset.user_head, scriptName);
}


function getConfig(key, type)
{
	//-1原始，返回null，0 = 字符，返回空, 1 = 数字返回0,
	if (type == undefined)
		type = 0;
	var value = window.localStorage.getItem(key);
	if (window.localStorage)
	{
		switch (type)
		{
			case 0: //字符
				return value || "";
				//break;
			case 1: //数字
				return value ? parseInt(0 + value.replace(/\D/ig, "")) : 0;
				//break;
			default: //原始
				return value;
		}
	} else
	{
		alert("浏览器不支持本地储存。");
	}
};
function setConfig(key, value)
{
	if (window.localStorage)
	{
		window.localStorage.setItem(key, value);
	} else
	{
		alert("浏览器不支持本地储存。");
	}
};
function ResetConfig(part)
{
	function partReset(key,value,ispart)
	{
		if (ispart && !getConfig(key, -1) || !ispart) setConfig(key, value);
	}
	partReset("PUBD_reset", Version, part);
	partReset("PUBD_PRC_path", "http://localhost:6800/jsonrpc", part);
	partReset("PUBD_download_mode", 0, part);
	partReset("PUBD_save_dir", "F:/PivixDownload/", part);
	partReset("PUBD_image_src", "%{original_src}", part);
	partReset("PUBD_save_path", "%{user_id}/%{filename}.%{extention}", part);
	partReset("PUBD_referer", "%{url}", part);
	partReset("PUBD_type_name0", "", part);
	partReset("PUBD_type_name1", "multiple", part);
	partReset("PUBD_type_name2", "ugoku", part);
	partReset("PUBD_type_name3", "manga", part);
	partReset("PUBD_multiple_mask", "%{illust_id}/", part);
	partReset("PUBD_desktop", 0, part);
	partReset("PUBD_desktop_main",[
		"[.ShellClassInfo]" ,
		"LocalizedResourceName=%{user_name}" ,
		"IconResource=head.ico,0" ,
		"IconFile=head.ico" ,
		"IconIndex=0" ,
		"InfoTip=作者id为%{user_id}，账户为%{user_pixiv_id}，目前有%{illust_count}件作品",
		//"[ViewState]" ,
		//"FolderType=Pictures" ,
		//"Logo=head.ico",
		"[LocalizedFileNames]",
		"%{desktop_line}",
		].join("\r\n")
		, part);
	partReset("PUBD_desktop_line", "%{filename}.%{extention}=%{illust_id}_%{title}_p%{page}", part);

	if (document.getElementsByName("PUBD_PRC_path")[0]) document.getElementsByName("PUBD_PRC_path")[0].value = getConfig("PUBD_PRC_path");
	//if (document.getElementsByName("PUBD_download_mode")[0]) document.getElementsByName("PUBD_download_mode")[getConfig("PUBD_download_mode",1)].checked = true;
	if (document.getElementsByName("PUBD_download_mode")[0]) document.getElementsByName("PUBD_download_mode")[0].checked = true;
	if (document.getElementsByName("PUBD_save_dir")[0]) document.getElementsByName("PUBD_save_dir")[0].value = getConfig("PUBD_save_dir");
	if (document.getElementsByName("PUBD_image_src")[0]) document.getElementsByName("PUBD_image_src")[0].value = getConfig("PUBD_image_src");
	if (document.getElementsByName("PUBD_save_path")[0]) document.getElementsByName("PUBD_save_path")[0].value = getConfig("PUBD_save_path");
	if (document.getElementsByName("PUBD_referer")[0]) document.getElementsByName("PUBD_referer")[0].value = getConfig("PUBD_referer");
	if (document.getElementsByName("PUBD_type_name0")[0]) document.getElementsByName("PUBD_type_name0")[0].value = getConfig("PUBD_type_name0");
	if (document.getElementsByName("PUBD_type_name1")[0]) document.getElementsByName("PUBD_type_name1")[0].value = getConfig("PUBD_type_name1");
	if (document.getElementsByName("PUBD_type_name2")[0]) document.getElementsByName("PUBD_type_name2")[0].value = getConfig("PUBD_type_name2");
	if (document.getElementsByName("PUBD_type_name3")[0]) document.getElementsByName("PUBD_type_name3")[0].value = getConfig("PUBD_type_name3");
	if (document.getElementsByName("PUBD_multiple_mask")[0]) document.getElementsByName("PUBD_multiple_mask")[0].value = getConfig("PUBD_multiple_mask");
	if (document.getElementsByName("PUBD_desktop")[0]) document.getElementsByName("PUBD_desktop")[0].checked = false;
	if (document.getElementsByName("PUBD_desktop_main")[0]) { document.getElementsByName("PUBD_desktop_main")[0].value = getConfig("PUBD_desktop_main"); document.getElementsByName("PUBD_desktop_main")[0].disabled = !document.getElementsByName("PUBD_desktop")[0].checked; }
	if (document.getElementsByName("PUBD_desktop_line")[0]) { document.getElementsByName("PUBD_desktop_line")[0].value = getConfig("PUBD_desktop_line"); document.getElementsByName("PUBD_desktop_line")[0].disabled = !document.getElementsByName("PUBD_desktop")[0].checked; }

	if (!part) spawnNotification("欢迎使用" + scriptName + " v" + scriptVersion, "http://tp3.sinaimg.cn/1820635862/180/5756282373/1", "枫谷剑仙");
};

function showMask(str,ill,index,deal)
{
	if (ill == undefined)
		ill = {};
	if (index == undefined)
		index = 0;
	if (deal == undefined)
		deal = function (arg) { return arg;}
	var newTxt = str;
	var regMask = /%{([^}]+)}/g;
	var rs = regMask.exec(str);
	while (rs != null) {
		if (rs[1] == "multiple")
		{
			var rp = "";
			if (ill.type == 1)
			{
				if (getConfig("PUBD_multiple_mask").indexOf("%{multiple}") >= 0 || getConfig("PUBD_multiple_mask").indexOf("%{type_name}") >= 0 && getConfig("PUBD_type_name" + ill.type).indexOf("%{multiple}" >= 0))
					console.error("掩码中存在循环自身引用");
				else
					var rp = showMask(getConfig("PUBD_multiple_mask"), ill, index, deal);
			}
			newTxt = newTxt.replace(rs[0], rp);
		}
		else if (rs[1] == "type_name")
		{
			var rp = "";
			if (getConfig("PUBD_type_name" + ill.type).indexOf("%{type_name}") >= 0 || getConfig("PUBD_type_name" + ill.type).indexOf("%{multiple}") >= 0 && getConfig("PUBD_multiple_mask").indexOf("%{type_name}" >= 0))
				console.error("掩码中存在循环自身引用");
			else
				var rp = showMask(getConfig("PUBD_type_name" + ill.type), ill, index, deal);
			newTxt = newTxt.replace(rs[0], rp);
		}
		else if (rs[1] == "page")
			newTxt = newTxt.replace(rs[0], index);
		else if (rs[1] == "filename" || rs[1] == "extention" || rs[1] == "original_src")
			newTxt = newTxt.replace(rs[0], deal(ill[rs[1]][index]));
		else if (ill[rs[1]] != undefined)
			newTxt = newTxt.replace(rs[0], deal(ill[rs[1]]));
		else if (dataset[rs[1]] != undefined)
			newTxt = newTxt.replace(rs[0], deal(dataset[rs[1]]));
		var rs = regMask.exec(str);
	}
	return newTxt;
}

function replacePathSafe(str, keepTree) //去除Windows下无法作为文件名的字符，目前为了支持Linux暂不替换两种斜杠吧。
{
	var nstr = "";
	if (typeof (str) == "undefined") return nstr;
	str = str.toString();
	if (keepTree)
		nstr = str.replace(/[\*\?"<>\|]/ig, "_");
	else
		nstr = str.replace(/[\\\/:\*\?"<>\|\r\n]/ig, "_");
	return nstr;
}
})();