// ==UserScript==
// @name        PixivUserBatchDownload
// @name:zh-CN  P站画师个人作品批量下载工具
// @namespace   http://www.mapaler.com/
// @description Batch download pixiv user's images in one key.
// @description:zh-CN   一键批量下载P站画师的全部作品
// @include     http://www.pixiv.net/*
// @version     1.2.0
// @grant       none
// @copyright   2016+, Mapaler <mapaler@163.com>
// @icon        http://source.pixiv.net/www/images/pixiv_logo.gif
// ==/UserScript==

(function() {
var pICD = 20; //pageIllustCountDefault默认每页作品数量
var getPicNum = 0; //Ajax获取了文件的数量
var downOver; //检测下载是否完成的循环函数

if (getConfig("PUBD_reset") != "1") ResetConfig(); //新用户重置设置

var dataset =
{
    user_id: 0, //作者ID
    user_name: "", //作者昵称
    illust_count: 0, //作品总数
    illust_file_count: 0, //作品文件总数（含多图）
    illust:[
    ]
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
        extention: [""], //扩展名
        original_src: [""], //原始图片链接
        //page: 0, //第几页（漫画）
        page_count: 0, //共几页（漫画）
        year: 0,
        month: 0,
        day: 0,
        hour: 0,
        minute: 0,
        second: 0,

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
            getSource(url, dealIllust, this);
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
var setInsertPlace = document.getElementsByClassName("column-header")[0] || document.body;
var setWindow = buildSetting();
//生成导出窗口DOM
var exportInsertPlace = setInsertPlace;
var exportWindow = buildExport();

/*
menu_ul.onmouseout = function (e) //需要判断是不是内部小框架
{
	if (!e) e = window.event;
	var reltg = e.relatedTarget ? e.relatedTarget : e.toElement;
	while (reltg && reltg != this) reltg = reltg.parentNode;
	if (reltg != this)
	{
		//menu_ul.style.display = "none";
		li1.removeChild(menu_ul);
	}
}
	
btnStart.onmouseover = function (e) //需要判断是不是内部小框架
{
	if (!e) e = window.event;
	var reltg = e.relatedTarget ? e.relatedTarget : e.fromElement;
	while (reltg && reltg != this) reltg = reltg.parentNode;
	if (reltg != this) {
		//menu_ul.style.display = "block";
		li1.appendChild(menu_ul);
	}
}
*/


//开始程序
function startProgram(mode)
{
    if(getPicNum<1)
    {
    	dealUserPage1();
    }
    clearInterval(downOver);
    downOver = setInterval(function () { startProgramCheck(mode) }, 500);
}

function dealUserPage1(userId)
{
	if (userId == undefined)
		userId = pixiv.context.userId;
	dataset.user_id = userId;

	var locationSearch = (document.location.search.length > 0 ? document.location.search.replace(/mode=\w+/ig, "").replace(/illust_id=\d+/ig, "").replace(/id=\d+/ig, "") : "?");
	var linkPre = document.location.origin + "/member_illust.php" + locationSearch + "&id=" + userId;
	var link = getPageSrc(linkPre, 1);

	getSource(link, dealUser, linkPre, userId)
}
//开始分析本作者
function dealUser(response, linkPre, userId)
{
	var parser = new DOMParser();
	PageDOM = parser.parseFromString(response, "text/html");

	var user_link = PageDOM.getElementsByClassName("user-link")[0];
	var user_dom = user_link.getElementsByClassName("user")[0];
	dataset.user_name = user_dom.textContent;
	var count_badge = PageDOM.getElementsByClassName("count-badge");
    if (count_badge.length < 1)
    {
        alert("未发现作品数DOM");
        clearInterval(downOver);
        return;
    }

    var regPC = /(\d+)/ig;
    var photoCount = regPC.exec(count_badge[0].textContent);

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

    var column_title = PageDOM.getElementsByClassName("column-title");
    var self = column_title[0].getElementsByClassName("self");

    dealPage(response, 1);
    //列表页循环
    for (pi = 2; pi <= pageCount; pi++)
    //for (pi = 0; pi < 1; pi++)
    {
        var link = getPageSrc(linkPre, pi);
        getSource(link, dealPage, pi);
    }

}

//获取页面网址
function getPageSrc(linkPre, page)
{
    return linkPre + "&p=" + page;
}

//直接通过XMLHttpRequest对象获取远程网页源代码
function getSource(url,callback,index, index2)
{
	var xhr = new XMLHttpRequest();	//创建XMLHttpRequest对象
	xhr.onreadystatechange = function()  //设置回调函数
	{
	    if (xhr.readyState == 4 && xhr.status == 200)
	        callback(xhr.responseText, index, index2);
	}
	xhr.open("GET", url, true);
	xhr.send(null);
	return xhr.responseText;
}
//处理列表页面的回调函数
function dealPage(response, pageIndex)
{
    /*
    老式构建网页dom方法
    var PageDOM = document.createElement("div"); //创建一个容器
    PageDOM.innerHTML = response; //插入代码
    */

    var parser = new DOMParser();
    PageDOM = parser.parseFromString(response, "text/html");

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
            	console.log("你的浏览器无法获取DOMParser内a标签的href。目前只有Chrome这么做。")
            	ill.url = document.location.origin + link[0].getAttribute("href");
            }
            else
            {
            	ill.url = link[0].href;
            }
            ill.title = title.textContent;
            ill.addIndexFromPage(ii + 1, pageIndex, dataset.illust_count);
            //ill.illust_index_in_page = ii + 1;
            //ill.addFromThumbnail(_thumbnail.src);
            ill.thumbnail_src = _thumbnail.src;
            ill.ajaxLoad();
            //ill.addFromUrl(link.href);
            if (image_items[ii].getElementsByClassName("ugoku-illust").length > 0)
                ill.type = 2;
            else if (image_items[ii].getElementsByClassName("multiple").length > 0)
            	ill.type = 1;
            else if (image_items[ii].getElementsByClassName("manga").length > 0)
            	ill.type = 3;
            else
                ill.type = 0;
            dataset.illust.push(ill);
        }
    }
}

//处理作品的回调函数
function dealIllust(response, ill)
{
	var regSrc = /https?:\/\/([^\/]+)\/.+\/(\d{4})\/(\d{2})\/(\d{2})\/(\d{2})\/(\d{2})\/(\d{2})\/((\d+)(?:[\-_][\w\d\-]+)?)\.([\w\d]+)/ig; //P站图片命名规则
    var parser = new DOMParser();
    PageDOM = parser.parseFromString(response, "text/html");
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
        //originalImage = "http://i2.pixiv.net/img-original/img/2016/01/26/00/01/01/54911277_p0.jpg";
        var aImg = regSrc.exec(originalImage);
        //console.log(aImg);
        //["http://i2.pixiv.net/img-...0/01/01/54911277_p0.jpg", "i2.pixiv.net", "2016", "01", "26", "00", "01", "01", "54911277_p0", "54911277", "jpg"]
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
            ill.extention[0] = aImg[10];
			getPicNum+=1;
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
        //zipUrl = "http://i3.pixiv.net/img-zip-ugoira/img/2015/06/02/01/50/26/50680914_ugoira1920x1080.zip";
        var aImg = regSrc.exec(zipUrl);
        //console.log(aImg);
        //["http://i3.pixiv.net/img-...914_ugoira1920x1080.zip", "i3.pixiv.net", "2015", "06", "02", "01", "50", "26", "50680914_ugoira1920x1080", "50680914", "zip"]
        if (aImg.length >= 1) {
            ill.domain = aImg[1];
            ill.year = aImg[2];
            ill.month = aImg[3];
            ill.day = aImg[4];
            ill.hour = aImg[5];
            ill.minute = aImg[6];
            ill.second = aImg[7];
            ill.filename[0] = aImg[8];
            ill.extention[0] = aImg[10];
			getPicNum+=1;
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
            ill.extention[0] = aImg[10];
        }

        var regPageCont = /.+\s+(\d+)[pP]/ig;
        var rs = regPageCont.exec(ill.size);
        if (rs.length >= 2)
        {
        	ill.page_count = parseInt(rs[1]);
        	console.log(ill.illust_id + "为多图，存在" + ill.page_count + "张")
            dataset.illust_file_count += ill.page_count - 1; //图片总数里增加多图的张数
			
            var manga_big = ill.url.replace(/mode=[^&]+/, "mode=manga_big");
			var manga_big_url = manga_big + "&page=" + 0;
			getSource(manga_big_url, dealManga, ill);
			
			/*以前以为能够多图扩展名不一样
            for (var pi = 0; pi < ill.page_count; pi++) {
                var manga_big_url = manga_big + "&page=" + pi;
                getSource(manga_big_url, dealManga, ill, pi);
            }
			*/
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
    	//thumbnailImage = "http://i3.pixiv.net/c/600x600/img-master/img/2015/05/13/21/36/35/50358638_p0_master1200.jpg";
    	var aImg = regSrc.exec(thumbnailImage.src);
    	//console.log(aImg);
    	//["http://i2.pixiv.net/img-...0/01/01/54911277_p0.jpg", "i2.pixiv.net", "2016", "01", "26", "00", "01", "01", "54911277_p0", "54911277", "jpg"]
    	if (aImg.length >= 1)
    	{
    		ill.domain = aImg[1];
    		ill.year = aImg[2];
    		ill.month = aImg[3];
    		ill.day = aImg[4];
    		ill.hour = aImg[5];
    		ill.minute = aImg[6];
    		ill.second = aImg[7];
			//因为不知道扩展名是什么，因此3种可能的扩展名都加入（反正不正确的无法下载）
    		ill.filename[0] = aImg[9] + "_p0";
    		ill.extention[0] = aImg[10];
    		ill.filename[1] = ill.filename[0];
    		ill.extention[1] = aImg[10] == "jpg" ? "png" : "jpg";
    		ill.filename[2] = ill.filename[0];
    		ill.extention[2] = aImg[10] != "gif" ? "gif" : "png";
    		for (ti = 0; ti < 3; ti++)
    		{
    			ill.original_src[ti] = "http://" + ill.domain + "/img-original/img/" +
					ill.year + "/" + ill.month + "/" + ill.day + "/" +
					ill.hour + "/" + ill.minute + "/" + ill.second + "/" +
					ill.filename[ti] + "." + ill.extention[ti] + "";
    		}
    		getPicNum += 1;
    	} else
    	{
    		alert("获取漫画原始图片路径信息失败，可能需要更新正则匹配模式。");

    	}
    }
    else
    {
    	console.log(ill);
    	alert("未知的作品类型。作品ID：" + ill.illust_id);
    }
}

//处理多图的回调函数
function dealManga(response, ill, index)
{
	var parser = new DOMParser();
	PageDOM = parser.parseFromString(response, "text/html");
	var picture = PageDOM.getElementsByTagName("img")[0];
	ill.original_src[0] = picture.src;
	var regSrc = /https?:\/\/([^\/]+)\/.+\/(\d{4})\/(\d{2})\/(\d{2})\/(\d{2})\/(\d{2})\/(\d{2})\/((\d+)(?:[\-_][\w\d\-]+)?)\.([\w\d]+)/ig; //P站图片命名规则
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
		ill.extention[0] = aImg[10];
		getPicNum += 1;
	} else
	{
		alert("获取多图原始图片信息失败，可能需要更新正则匹配模式。");
	}
	
	for (var pi = 1; pi < ill.page_count; pi++)
	{
		ill.extention[pi] = ill.extention[0];
		ill.filename[pi] = ill.filename[0].replace("_p0", "_p" + pi);
		ill.original_src[pi] = ill.original_src[0].replace(ill.filename[0], ill.filename[pi]);
		getPicNum += 1;
	}
}

var ARIA2 = (function () {
    var jsonrpc_version = '2.0';

    function get_auth(url) {
        return url.match(/^(?:(?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(?:\/\/)?(?:([^:@]*(?::[^:@]*)?)?@)?/)[1];
    };

    function request(jsonrpc_path, method, params, getVersion) {
        var xhr = new XMLHttpRequest();
        var auth = get_auth(jsonrpc_path);
        jsonrpc_path = jsonrpc_path.replace(/^((?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(\/\/)?(?:(?:[^:@]*(?::[^:@]*)?)?@)?(.*)/, '$1$2$3'); // auth string not allowed in url for firefox

        var request_obj = {
            jsonrpc: jsonrpc_version,
            method: method,
            id: getVersion ? "1" : (new Date()).getTime().toString(),
        };
        if (params) request_obj['params'] = params;
        if (auth && auth.indexOf('token:') == 0) params.unshift(auth);

        xhr.open("POST", jsonrpc_path + "?tm=" + (new Date()).getTime().toString(), true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        if (auth && auth.indexOf('token:') != 0) {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(auth));
        }
        xhr.send(JSON.stringify(request_obj));
        if (getVersion) {
            xhr.onreadystatechange = function ()  //设置回调函数
            {
                if (xhr.readyState == 4 && xhr.status == 200)
                {
                    var JSONreq = JSON.parse(xhr.responseText);
                    document.getElementsByName("PUBD_PRC_path_check")[0].innerHTML="发现Aria2 ver" + JSONreq.result.version;
                }
                else if (xhr.readyState == 4 && xhr.status != 200)
                    document.getElementsByName("PUBD_PRC_path_check")[0].innerHTML="Aria2连接失败";
            }
        }
    };

    return function (jsonrpc_path) {
        this.jsonrpc_path = jsonrpc_path;
        this.addUri = function (uri, options) {
            request(this.jsonrpc_path, 'aria2.addUri', [[uri, ], options]);
        };
        this.getVersion = function () {
            request(this.jsonrpc_path, 'aria2.getVersion', [], true);
        };
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
		if (setWindow.parentNode != setInsertPlace)
			exportInsertPlace.appendChild(exportWindow);
		li1.removeChild(menu_ul);
		startProgram(1);
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
            ".PUBD_save_path,.PUBD_multiple_mask" + "{\r\n" + [
                'width:340px' ,
            ].join(';') + "\r\n}",
            "#PixivUserBatchDownloadSetting .thread" + "{\r\n" + [
                'height:40px',
            ].join(';') + "\r\n}",
            "#PixivUserBatchDownloadSetting .type_name" + "{\r\n" + [
                'height:60px',
            ].join(';') + "\r\n}",
            "#PixivUserBatchDownloadSetting .text" + "{\r\n" + [
                'height:4em',
            ].join(';') + "\r\n}",
        ].join('\r\n');


    //标题行
    var h2 = document.createElement("h2");
    h2.innerHTML = "Pixiv画师作品批量获取工具选项";

    var a = document.createElement("a");
    a.className = "_official-badge";
    a.innerHTML = "设置说明";
    a.href = "https://github.com/Mapaler/PixivUserBatchDownload/blob/master/README.md";
    a.target = "_blank";
    h2.appendChild(a);
    //设置内容
    var ul = document.createElement("ul");
    ul.className = "notification-list message-thread-list";

    /*
    //设置-模式
    var li = document.createElement("li");
    li.className = "thread";
    li.style.display = "none";
    var divTime = document.createElement("div");
    divTime.className = "time date";
    var divName = document.createElement("div");
    divName.className = "name";
    var divText = document.createElement("div");
    divText.className = "text";
    li.appendChild(divTime);
    li.appendChild(divName);
    li.appendChild(divText);
    //ul.appendChild(li);

    divName.innerHTML = "功能选择(开发中)";
    divTime.innerHTML = "选择基本功能或自定义高级参数"

    var lbl = document.createElement("label");
    var ipt = document.createElement("input");
    ipt.type = "radio";
    ipt.value = 0;
    ipt.name = "PUBD_mode";
    lbl.appendChild(ipt);
    lbl.innerHTML += "简单模式";
    divText.appendChild(lbl);
    var lbl = document.createElement("label");
    var ipt = document.createElement("input");
    ipt.type = "radio";
    ipt.value = 1;
    ipt.name = "PUBD_mode";
    lbl.appendChild(ipt);
    lbl.innerHTML += "专家模式";
    divText.appendChild(lbl);
    */


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
    ipt.value = getConfig("PUBD_PRC_path");
    divText.appendChild(ipt);
    var btnCheckLink = document.createElement("button");
    btnCheckLink.className = "_button";
    btnCheckLink.name = "PUBD_PRC_path_check";
    btnCheckLink.innerHTML = "检测地址";
    btnCheckLink.onclick = function ()
    {
        this.innerHTML = "正在连接...";
        var aria2 = new ARIA2(document.getElementsByName("PUBD_PRC_path")[0].value);
        aria2.getVersion();
    }
    divText.appendChild(btnCheckLink);
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

    divName.innerHTML = "下载路径";
    divTime.innerHTML = "下载到本地路径和文件名"
    var ipt = document.createElement("input");
    ipt.type = "text";
    ipt.className = "PUBD_save_path";
    ipt.name = "PUBD_save_path";
    ipt.value = getConfig("PUBD_save_path");
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

    var lbl = document.createElement("label");
    lbl.innerHTML = "单图：";
    var ipt = document.createElement("input");
    ipt.type = "text";
    ipt.className = "PUBD_type_name";
    ipt.name = "PUBD_type_name0";
    ipt.value = getConfig("PUBD_type_name0");
    lbl.appendChild(ipt);
    divText.appendChild(lbl);

    var lbl = document.createElement("label");
    lbl.innerHTML = "多图：";
    var ipt = document.createElement("input");
    ipt.type = "text";
    ipt.className = "PUBD_type_name";
    ipt.name = "PUBD_type_name1";
    ipt.value = getConfig("PUBD_type_name1");
    lbl.appendChild(ipt);
    divText.appendChild(lbl);

    var lbl = document.createElement("label");
    lbl.innerHTML = "动图：";
    var ipt = document.createElement("input");
    ipt.type = "text";
    ipt.className = "PUBD_type_name";
    ipt.name = "PUBD_type_name2";
    ipt.value = getConfig("PUBD_type_name2");
    lbl.appendChild(ipt);
    divText.appendChild(lbl);

    var lbl = document.createElement("label");
    lbl.innerHTML = "漫画：";
    var ipt = document.createElement("input");
    ipt.type = "text";
    ipt.className = "PUBD_type_name";
    ipt.name = "PUBD_type_name3";
    ipt.value = getConfig("PUBD_type_name3");
    lbl.appendChild(ipt);
    divText.appendChild(lbl);
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
    ipt.className = "PUBD_multiple_mask";
    ipt.name = "PUBD_multiple_mask";
    ipt.value = getConfig("PUBD_multiple_mask");
    divText.appendChild(ipt);

    //确定按钮行
    var confirmbar = document.createElement("div");
    confirmbar.className = "_notification-request-permission";
    confirmbar.style.display = "block";
    var btnConfirm = document.createElement("button");
    btnConfirm.className = "_button";
    btnConfirm.innerHTML = "确定";
    var btnCancel = document.createElement("button");
    btnCancel.className = "_button";
    btnCancel.innerHTML = "取消";
    btnCancel.onclick = function () { set.parentNode.removeChild(set); }
    var btnReset = document.createElement("button");
    btnReset.className = "_button";
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
        setConfig("PUBD_PRC_path", document.getElementsByName("PUBD_PRC_path")[0].value);
        setConfig("PUBD_save_path", document.getElementsByName("PUBD_save_path")[0].value);
        setConfig("PUBD_type_name0", document.getElementsByName("PUBD_type_name0")[0].value);
        setConfig("PUBD_type_name1", document.getElementsByName("PUBD_type_name1")[0].value);
        setConfig("PUBD_type_name2", document.getElementsByName("PUBD_type_name2")[0].value);
        setConfig("PUBD_type_name3", document.getElementsByName("PUBD_type_name3")[0].value);
        setConfig("PUBD_multiple_mask", document.getElementsByName("PUBD_multiple_mask")[0].value);

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
                'min-height:100px',
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
    var ipt = document.createElement("textarea");
    ipt.className = "PUBD_batch";
    ipt.name = "PUBD_batch";
    ipt.wrap = "off";
    divText.appendChild(ipt);

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
    btnExport.download = "aria2" + ".down"
    btnExport.innerHTML = "导出Aria2 *.down文件";
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
//检测下载完成情况
function startProgramCheck(mode) {
    if (getPicNum > 0 && getPicNum >= dataset.illust_file_count) {
        li2.innerHTML = "获取完成：" + getPicNum + "/" + dataset.illust_file_count;
        startDownload(mode);
        clearInterval(downOver);
    }
    else
    {
        li2.innerHTML = "已获取图像地址：" + getPicNum + "/" + dataset.illust_file_count;
        var PUBD_batch = document.getElementsByName("PUBD_batch")[0];
        if (PUBD_batch) PUBD_batch.value = li2.innerHTML;
    }
    console.log("获取" + getPicNum + "/" + dataset.illust_file_count);
}
//开始构建下载
function startDownload(mode) {
    switch (mode)
    {
        case 0: //RPC模式
            var aria2 = new ARIA2(getConfig("PUBD_PRC_path"));

            for (ii = 0; ii < dataset.illust.length; ii++) {
                var ill = dataset.illust[ii];
                for (pi = 0; pi < ill.original_src.length; pi++) {
                    aria2.addUri(ill.original_src[pi], {
                        "out": replacePathSafe(showMask(getConfig("PUBD_save_path"), ill, pi)),
                        "referer": ill.url,
                        "remote-time": "true",
                        "allow-overwrite": "false",
                        "auto-file-renaming": "false"
                    });
                }
            }
            alert("全部发送完毕");
            break;
        case 1: //生成BAT下载命令模式
            var txt = "";
            var downtxt = "";
            for (ii = 0; ii < dataset.illust.length; ii++)
            {
                var ill = dataset.illust[ii];
                for (pi = 0; pi < ill.original_src.length; pi++)
                {
                    txt += "aria2c --allow-overwrite=false --auto-file-renaming=false --remote-time=true --out=\"" + replacePathSafe(showMask(getConfig("PUBD_save_path"), ill, pi)) + "\" --referer=\"" + ill.url + "\" \"" + ill.original_src[pi] + "\"";
                    downtxt += ill.original_src[pi]
						+ "\r\n out=\"" + replacePathSafe(showMask(getConfig("PUBD_save_path"), ill, pi)) + "\""
						+ "\r\n referer=\"" + ill.url + "\""
						+ "\r\n allow-overwrite=false"
						+ "\r\n auto-file-renaming=false"
						+ "\r\n remote-time=true"
						;
                    txt += "\r\n";
                    downtxt += "\r\n\r\n";
                }
            }
            var txta = document.getElementsByName("PUBD_batch")[0];
            var btn = document.getElementsByName("PUBD_down")[0];
            if (txta) txta.value = txt;
            var downurl = "data:text/html;charset=utf-8," + encodeURIComponent(downtxt);
            if (btn)
            {
            	btn.href = downurl;
            	btn.download = dataset.user_id + "_" + dataset.user_name + ".down"
            }
            //console.log(txt);
            break;
        default:
            alert("未知的下载模式");
            break;
    }
    //console.log(dataset);
};
	
function getConfig(key) {
    if (window.localStorage) {
        return window.localStorage.getItem(key) || "";
    } else {
        return getCookie(key);
    }
};
function setConfig(key, value) {
    if (window.localStorage) {
        window.localStorage.setItem(key, value);
    } else {
        setGdCookie(key, value, 86400 * 365);
    }
};
function ResetConfig() {
    setConfig("PUBD_reset", "1");
    setConfig("PUBD_PRC_path", "http://localhost:6800/jsonrpc");
    setConfig("PUBD_save_path", "%{user_id}_%{user_name}\\%{multiple}%{filename}.%{extention}");
    setConfig("PUBD_type_name0", "");
    setConfig("PUBD_type_name1", "multiple");
    setConfig("PUBD_type_name2", "ugoku");
    setConfig("PUBD_type_name3", "manga");
    setConfig("PUBD_multiple_mask", "%{illust_id}_%{title}\\");

    if (document.getElementsByName("PUBD_PRC_path")[0]) document.getElementsByName("PUBD_PRC_path")[0].value = getConfig("PUBD_PRC_path");
    if (document.getElementsByName("PUBD_save_path")[0]) document.getElementsByName("PUBD_save_path")[0].value = getConfig("PUBD_save_path");
    if (document.getElementsByName("PUBD_type_name0")[0]) document.getElementsByName("PUBD_type_name0")[0].value = getConfig("PUBD_type_name0");
    if (document.getElementsByName("PUBD_type_name1")[0]) document.getElementsByName("PUBD_type_name1")[0].value = getConfig("PUBD_type_name1");
    if (document.getElementsByName("PUBD_type_name2")[0]) document.getElementsByName("PUBD_type_name2")[0].value = getConfig("PUBD_type_name2");
    if (document.getElementsByName("PUBD_type_name3")[0]) document.getElementsByName("PUBD_type_name3")[0].value = getConfig("PUBD_type_name3");
    if (document.getElementsByName("PUBD_multiple_mask")[0]) document.getElementsByName("PUBD_multiple_mask")[0].value = getConfig("PUBD_multiple_mask");
};

function showMask(str,ill,index)
{
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
                    console.log("掩码中存在循环自身引用");
                else
                    var rp = showMask(getConfig("PUBD_multiple_mask"), ill, index);
            }
            newTxt = newTxt.replace(rs[0], rp);
        }
        else if (rs[1] == "type_name")
        {
            var rp = "";
            if (getConfig("PUBD_type_name" + ill.type).indexOf("%{type_name}") >= 0 || getConfig("PUBD_type_name" + ill.type).indexOf("%{multiple}") >= 0 && getConfig("PUBD_multiple_mask").indexOf("%{type_name}" >= 0))
                console.log("掩码中存在循环自身引用");
            else
                var rp = showMask(getConfig("PUBD_type_name" + ill.type), ill, index);
            newTxt = newTxt.replace(rs[0], rp);
        }
        else if (rs[1] == "page")
            newTxt = newTxt.replace(rs[0], index);
        else if (rs[1] == "filename" || rs[1] == "extention" || rs[1] == "original_src")
            newTxt = newTxt.replace(rs[0], ill[rs[1]][index]);
        else if (ill[rs[1]] != undefined)
            newTxt = newTxt.replace(rs[0], ill[rs[1]]);
        else if (dataset[rs[1]] != undefined)
            newTxt = newTxt.replace(rs[0], dataset[rs[1]]);
        var rs = regMask.exec(str);
    }
    return newTxt;
}

function replacePathSafe(str) //去除Windows下无法作为文件名的字符
{
    return str.replace(/\\\/:\*\?"<>|/ig, "_");
}
})();
