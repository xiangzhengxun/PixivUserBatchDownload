// ==UserScript==
// @name		PixivUserBatchDownload
// @name:zh-CN	P站画师个人作品批量下载工具
// @namespace	http://www.mapaler.com/
// @description	Batch download pixiv user's images in one key.
// @description:zh-CN	一键批量下载P站画师的全部作品
// @homepage    https://github.com/Mapaler/PixivUserBatchDownload
// @supportURL  https://github.com/Mapaler/PixivUserBatchDownload/issues
// @updateURL   https://greasyfork.org/scripts/17879/code/PixivUserBatchDownload.user.js
// @downloadURL https://greasyfork.org/scripts/17879/code/PixivUserBatchDownload.user.js
// @include		*://www.pixiv.net/*
// @exclude		*://www.pixiv.net/*mode=manga&illust_id*
// @exclude		*://www.pixiv.net/*mode=big&illust_id*
// @exclude		*://www.pixiv.net/*mode=manga_big*
// @exclude		*://www.pixiv.net/*search.php*
// @version		5.7.48
// @copyright	2018+, Mapaler <mapaler@163.com>
// @icon		http://www.pixiv.net/favicon.ico
// @grant       unsafeWindow
// @grant       window.close
// @grant       window.focus
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_addValueChangeListener
// -@grant       GM_notification
// @grant       GM_registerMenuCommand
// @connect     localhost
// @connect     pixiv.net
// @connect     127.0.0.1
// ==/UserScript==

/*
 * 公共变量区
 */
var pubd = { //储存设置
    configVersion: 0, //当前设置版本，用于提醒是否需要重置
    cssVersion: 9, //当前需求CSS版本，用于提醒是否需要更新CSS
    touch: false, //是触屏
    loggedIn: false, //登陆了
    start: null, //开始按钮
    menu: null, //菜单
    dialog: { //窗口些个
        config: null, //设置窗口
        login: null, //登陆窗口
        downthis: null, //下载当前窗口
    },
    auth: null,
    downSchemes: [],
    downbreak: false,
    staruser: [],
};

var scriptName = typeof(GM_info) != "undefined" ? (GM_info.script.localizedName ? GM_info.script.localizedName : GM_info.script.name) : "PixivUserBatchDownload"; //本程序的名称
var scriptVersion = typeof(GM_info) != "undefined" ? GM_info.script.version : "LocalDebug"; //本程序的版本
var scriptIcon = ((typeof(GM_info) != "undefined") && GM_info.script.icon) ? GM_info.script.icon : "http://www.pixiv.net/favicon.ico"; //本程序的图标

var illustPattern = '(https?://([^/]+)/.+/\\d{4}/\\d{2}/\\d{2}/\\d{2}/\\d{2}/\\d{2}/(\\d+(?:-([0-9a-zA-Z]+))?(?:_p|_ugoira)))\\d+(?:_\\w+)?\\.([\\w\\d]+)'; //P站图片地址正则匹配式
var limitingPattern = '(https?://([^/]+)/common/images/(limit_(mypixiv|unknown)))_\\d+\\.([\\w\\d]+)'; //P站上锁图片地址正则匹配式

var UA = "PixivAndroidApp/5.0.115 (Android 9.0.0; Android SDK built for x86)"; //向P站请求数据时的UA
var thisPageUserid = 0; //当前页面的画师ID
var findInsertPlaceHook; //储存循环钩子
var btnStartInsertPlace; //储存开始按钮插入点
/*
 * 获取初始状态
 */
//1、获取原网页数据对象
if (typeof(unsafeWindow) != "undefined")
{
    var pixiv = unsafeWindow.pixiv; //原来的信息
    var globalInitData = unsafeWindow.globalInitData; //新版的插画页面信息
}
//2、获取是否为登录状态与当前页面画师ID
if (typeof(pixiv) == "undefined" && typeof(globalInitData) == "undefined")
{
        console.error("PUBD：当前网页没有找到 pixiv 对象和 globalInitData 对象");
}
else
{
    if (typeof(globalInitData) != "undefined") //新版的插画页面信息
    {
        pubd.loggedIn = true;
        thisPageUserid = Object.keys(globalInitData.preload.user)[0];
    }
    else if (typeof(pixiv) != "undefined") //原来的信息
    {
        thisPageUserid = pixiv.context.userId;
        if (pixiv.user.loggedIn)
        {
            pubd.loggedIn = true; //判断是否已经登陆
        }
    }
}
//3、获取是否为手机版
if (location.host.indexOf("touch") >= 0) //typeof(pixiv.AutoView)!="undefined"
{
    pubd.touch = true;
    console.info("PUBD：当前访问的是P站触屏手机版，我没开发。");
} else {
    console.info("PUBD：当前访问的是P站桌面版");
}

/*
 * Debug 用 仿GM函数区
 */
//仿GM_xmlhttpRequest函数v1.3
if (typeof(GM_xmlhttpRequest) == "undefined") {
    var GM_xmlhttpRequest = function(GM_param) {

        var xhr = new XMLHttpRequest(); //创建XMLHttpRequest对象
        xhr.open(GM_param.method, GM_param.url, true);
        if (GM_param.responseType) xhr.responseType = GM_param.responseType;
        if (GM_param.overrideMimeType) xhr.overrideMimeType(GM_param.overrideMimeType);
        xhr.onreadystatechange = function() //设置回调函数
            {
                if (xhr.readyState === xhr.DONE) {
                    if (xhr.status === 200 && GM_param.onload)
                        GM_param.onload(xhr);
                    if (xhr.status !== 200 && GM_param.onerror)
                        GM_param.onerror(xhr);
                }
            }

        for (var header in GM_param.headers) {
            xhr.setRequestHeader(header, GM_param.headers[header]);
        }

        xhr.send(GM_param.data ? GM_param.data : null);
    }
}
//仿GM_getValue函数v1.0
if (typeof(GM_getValue) == "undefined") {
    var GM_getValue = function(name, type) {
        var value = localStorage.getItem(name);
        if (value == undefined) return value;
        if ((/^(?:true|false)$/i.test(value) && type == undefined) || type == "boolean") {
            if (/^true$/i.test(value))
                return true;
            else if (/^false$/i.test(value))
                return false;
            else
                return Boolean(value);
        } else if ((/^\-?[\d\.]+$/i.test(value) && type == undefined) || type == "number")
            return Number(value);
        else
            return value;
    }
}
//仿GM_setValue函数v1.0
if (typeof(GM_setValue) == "undefined") {
    var GM_setValue = function(name, value) {
        localStorage.setItem(name, value);
    }
}
//仿GM_deleteValue函数v1.0
if (typeof(GM_deleteValue) == "undefined") {
    var GM_deleteValue = function(name) {
        localStorage.removeItem(name);
    }
}
//仿GM_listValues函数v1.0
if (typeof(GM_listValues) == "undefined") {
    var GM_listValues = function() {
        var keys = new Array();
        for (var ki = 0, kilen = localStorage.length; ki < kilen; ki++) {
            keys.push(localStorage.key(ki));
        }
        return keys;
    }
}

//仿GM_notification函数v1.1，发送网页通知
if (typeof(GM_notification) == "undefined") {
    var GM_notification = function(text, title, image, onclick) {
        var options = {},rTitle,rText;
        if (typeof(text) == "string")
        { //普通模式
            rTitle = title;
            rText = text;
            options.body = text;
            options.icon = image;
        }else
        { //选项模式
            var details = text, ondone = title, onclose = image;
            rTitle = details.title;
            rText = details.text;
            if (details.text) options.body = details.text;
            if (details.image) options.icon = details.image;
            if (details.timeout) options.timestamp = details.timeout;
            //if (details.highlight) options.highlight = details.highlight; //没找到这个功能
        }

        function sendNotification(){
            var n = new Notification(rTitle, options);
            if (typeof(text) == "string")
            { //普通模式
                if (onclick) n.onclick = onclick;
            }else
            { //选项模式，这里和TamperMonkey API不一样，区分了关闭和点击。
                if (ondone) n.onclick = ondone;
                if (onclose) n.onclose = onclose;
            }
        }
        // 先检查浏览器是否支持
        if (!("Notification" in window)) {
            alert(rTitle + "\r\n" + rText);
        // 检查用户是否同意接受通知
        } else if (Notification.permission === "granted") {
            Notification.requestPermission(function(permission) {
                sendNotification();
            });
        }
        // 否则我们需要向用户获取权限
        else if (Notification.permission !== 'denied') {
            Notification.requestPermission(function(permission) {
                // 如果用户同意，就可以向他们发送通知
                if (permission === "granted") {
                    sendNotification();
                }
            });
        }
    }
}

//留空函数
if (typeof(GM_addValueChangeListener) == "undefined") {
    var GM_listValues = function() {return;}
}
if (typeof(GM_registerMenuCommand) == "undefined") {
    var GM_registerMenuCommand = function() {return;}
}

/*
 * 现成函数库
 */
//String.format实现占位符输出
String.prototype.format = function() {
    if (arguments.length == 0) return this;
    for (var s = this, i = 0; i < arguments.length; i++)
        s = s.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i]);
    return s;
};

/*
 * 自定义对象区
 */
//一个用户的信息
var UserInfo = function() {
    var obj = {
        done: false,
        info: {
            profile: null,
            user: null,
            profile: null,
        },
        illusts: {
            done: false,
            item: [],
            break: false,
            runing: false,
            next_url: "",
        },
        bookmarks: {
            done: false,
            item: [],
            break: false,
            runing: false,
            next_url: "",
        },
    }
    return obj;
}

//一个Post数据
var PostDataObject = (function() {

    return function(obj) {
        var postdata = new Object;
        if (obj)
            postdata.data = Object.assign({}, obj); //合并obj
        postdata.increase = function(obj) {
            postdata.data = Object.assign(postdata.data, obj); //合并obj
        }
        postdata.toPostString = function() {
            var arr = new Array;
            for (var na in postdata.data) {
                var item = [na, postdata.data[na]];
                arr.push(item);
            }

            var str = arr.map(
                function(item) {
                    return item.join("=");
                }
            ).join("&");
            return str;
        }
        return postdata;
    }
})();

//一个本程序使用的headers数据
var HeadersObject = function(obj) {
    var headers = {
        'App-OS': 'android',
        'App-OS-Version': '9.0.0',
        'App-Version': '5.0.115',
        'User-Agent': UA,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', //重要
        "Referer": "https://app-api.pixiv.net/",
    }
    if (obj)
        headers = Object.assign(headers, obj); //合并obj
    return headers;
}

//一个认证方案
var Auth = (function() {

    return function(username, password, remember) {
        if (!username) username = "";
        if (!password) password = "";
        if (!remember) remember = false;
        var auth = { //原始结构
            response: {
                access_token: "",
                expires_in: 0,
                token_type: "",
                scope: "",
                refresh_token: "",
                user: {
                    profile_image_urls: {
                        px_16x16: "",
                        px_50x50: "",
                        px_170x170: "",
                    },
                    id: "",
                    name: "",
                    account: "",
                    mail_address: "",
                    is_premium: false,
                    x_restrict: 0,
                    is_mail_authorized: true,
                },
                device_token: "",
            },
            needlogin: false,
            username: username,
            password: password,
            save_account: remember,
            login_date: null,
        }
        auth.newAccount = function(username, password, remember) {
            if (typeof(remember) == "boolean") auth.save_account = remember;
            auth.username = username;
            auth.password = password;
        }
        auth.loadFromResponse = function(response) {
            auth = Object.assign(auth, response);
        }
        auth.save = function() {
            var saveObj = JSON.parse(JSON.stringify(auth)); //深度拷贝
            if (!saveObj.save_account) {
                saveObj.username = "";
                saveObj.password = "";
            }
            GM_setValue("pubd-auth", JSON.stringify(saveObj));
        }

        auth.login = function(onload_suceess_Cb, onload_hasError_Cb, onload_notJson_Cb, onerror_Cb) {
            var postObj = new PostDataObject({ //Post时发送的数据
                client_id: "MOBrBDS8blbauoSck0ZfDbtuzpyT",
                client_secret: "lsACyCD94FhDUtGTXi3QzcFE2uU1hqtDaKeqrdwj",
                grant_type: "password",
                username: auth.username,
                password: auth.password,
                device_token: "pixiv",
                get_secure_url: "true",
            })

            //登陆是老的API
            GM_xmlhttpRequest({
                url: "https://oauth.secure.pixiv.net/auth/token",
                method: "post",
                responseType: "text",
                headers: new HeadersObject(),
                data: postObj.toPostString(),
                onload: function(response) {
                    try {
                        var jo = JSON.parse(response.responseText);
                        if (jo.has_error || jo.errors) {
                            console.error("登录失败，返回错误消息", jo);
                            onload_hasError_Cb(jo);
                        } else { //登陆成功
                            auth.loadFromResponse(jo);
                            auth.login_date = new Date();
                            console.info("登陆成功", jo);
                            onload_suceess_Cb(jo);
                        }
                    } catch (e) {
                        console.error("登录失败，返回可能不是JSON，或程序异常", e, response);
                        onload_notJson_Cb(response);
                    }
                },
                onerror: function(response) {
                    console.error("登录失败，AJAX发送失败", response);
                    onerror_Cb(response);
                }
            })
        }
        return auth;
    };
})();

//一个下载方案
var DownScheme = (function() {
    //一个自定义掩码
    return function(name) {
        var obj = {
            name: name ? name : "默认方案",
            rpcurl: "http://localhost:6800/jsonrpc",
            https2http: false,
            downfilter: "",
            savedir: "D:/PixivDownload/",
            savepath: "%{illust.user.id}/%{illust.filename}%{page}.%{illust.extention}",
            textout: "%{illust.url_without_page}%{page}.%{illust.extention}\n",
            masklist: [],
            mask: {
                add: function(name, logic, content) {
                    var mask = {
                        name: name,
                        logic: logic,
                        content: content,
                    };
                    obj.masklist.push(mask);
                    return mask;
                },
                remove: function(index) {
                    obj.masklist.splice(index, 1);
                },
            },
            loadFromJson: function(ojson) {
                var json = ojson;
                if (typeof(ojson) == "string") {
                    try {
                        json = JSON.parse(ojson);
                    } catch (e) {
                        console.error(e);
                        return false;
                    }
                }
                this.name = json.name;
                this.https2http = [0, "false", false, undefined, null].indexOf(json.https2http) < 0; //存在任一条件时即为false
                this.rpcurl = json.rpcurl;
                this.downfilter = json.downfilter || "";
                this.savedir = json.savedir;
                this.savepath = json.savepath;
                this.textout = json.textout;
                this.masklist = JSON.parse(JSON.stringify(json.masklist));
                return true;
            },
        }
        return obj;
    };
})();

//创建菜单类
var pubdMenu = (function() {
    //生成菜单项
    function buildMenuItem(title, classname, callback, submenu) {
        var item = document.createElement("li");
        item.subitem = null; //子菜单
        if (title == 0) //只添加一条线
        {
            item.className = "pubd-menu-line" + (classname ? " " + classname : "");
            return item;
        }
        item.className = "pubd-menu-item" + (classname ? " " + classname : "");
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

        if (typeof(callback) == "string") {
            a.target = "_blank";
            a.href = callback;
        } else if (typeof(callback) == "function") {
            item.addEventListener("click", callback);
            //a.onclick = callback;
        }

        if (typeof(submenu) == "object") {
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

    return function(touch, classname) {
        var menu = document.createElement("ul");
        menu.className = "pubd-menu display-none" + (classname ? " " + classname : "");
        menu.item = new Array();
        //显示该菜单
        menu.show = function() {
            menu.classList.remove("display-none");
        }
        menu.hide = function() {
                menu.classList.add("display-none");
            }
            //添加菜单项
        menu.add = function(title, classname, callback, submenu) {
                var itm = buildMenuItem(title, classname, callback, submenu);
                this.appendChild(itm);
                this.item.push(itm)
                return itm;
            }
            //鼠标移出菜单时消失
        menu.addEventListener("mouseleave", function(e) {
            this.hide();
        });
        return menu;
    };
})();

//创建通用对话框类
var Dialog = (function() {
    //构建标题栏按钮
    function buildDlgCptBtn(text, classname, callback) {
        if (!callback) classname = "";
        var btn = document.createElement("a");
        btn.className = "dlg-cpt-btn" + (classname ? " " + classname : "");
        if (typeof(callback) == "string") {
            btn.target = "_blank";
            btn.href = callback;
        } else {
            if (callback)
                btn.addEventListener("click", callback);
        }
        var btnTxt = document.createElement("div");
        btnTxt.className = "dlg-cpt-btn-text";
        btnTxt.innerHTML = text;
        btn.appendChild(btnTxt);

        return btn;
    }

    return function(caption, id, classname) {
        var dlg = document.createElement("div");
        dlg.className = "pubd-dialog display-none" + (classname ? " " + classname : "");

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
        cptBtns.add = function(text, classname, callback) {
            var btn = buildDlgCptBtn(text, classname, callback);
            this.insertBefore(btn, this.firstChild);
            return btn;
        }
        cptBtns.close = cptBtns.add("X", "dlg-btn-close", (function() {
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
        dlg.active = function() {
                if (!this.classList.contains("pubd-dlg-active")) { //如果没有激活的话才执行
                    var dlgs = document.getElementsByClassName("pubd-dialog");
                    for (var dlgi = 0; dlgi < dlgs.length; dlgi++) {
                        dlgs[dlgi].classList.remove("pubd-dlg-active"); //取消激活
                        dlgs[dlgi].style.zIndex = parseInt(window.getComputedStyle(dlgs[dlgi], null).getPropertyValue("z-index")) - 1;
                    }
                    this.style.zIndex = "";
                    this.classList.add("pubd-dlg-active"); //添加激活
                }
            }
            //窗口初始化
        dlg.initialise = function() {
                return;
            }
            //窗口显示
        dlg.show = function() {
                this.initialise();
                this.classList.remove("display-none");
                this.active();
            }
            //窗口隐藏
        dlg.hide = function() {
                this.cptBtns.close.click;
            }
            //添加鼠标拖拽移动
        dlg.drag = [0, 0]; //[X,Y]
        var drag = dlg.drag;
        //startDrag(cpt, dlg);
        cpt.addEventListener("mousedown", function(e) {
            var eX = e.pageX>0?e.pageX:0, eY = e.pageY>0?e.pageY:0;
            drag[0] = eX - dlg.offsetLeft;
            drag[1] = eY - dlg.offsetTop;
            var handler_mousemove = function(e) {
                var eX = e.pageX>0?e.pageX:0, eY = e.pageY>0?e.pageY:0;
                dlg.style.left = (eX - drag[0]) + 'px';
                dlg.style.top = (eY - drag[1]) + 'px';
            };
            var handler_mouseup = function(e) {
                document.removeEventListener("mousemove", handler_mousemove);
            };
            document.addEventListener("mousemove", handler_mousemove);
            document.addEventListener("mouseup", handler_mouseup, { once: true });
        });
        //点击窗口激活窗口
        dlg.addEventListener("mousedown", function(e) {
            dlg.active();
        });
        return dlg;
    };
})();

//创建选项卡类
var Tab = (function() {

    return function(title) {
        var obj = {
            title: document.createElement("li"),
            content: document.createElement("li"),
        }
        obj.title = document.createElement("li");
        obj.title.className = "pubd-tab-title";
        obj.title.innerHTML = title;
        obj.name = function() {
            return this.title.textContent;
        }
        obj.rename = function(newName) {
            if (typeof(newName) == "string" && newName.length > 0) {
                this.title.innerHTML = newName;
                return true;
            } else
                return false;
        }

        obj.content.className = "pubd-tab-content";
        obj.content.innerHTML = "设置内容";

        return obj;
    };
})();

//创建复数选项卡类
var Tabs = (function() {

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
        tabs.add = function(name) {
            var tab = new Tab(name);
            tabs.item.push(tab);
            ult.appendChild(tab.title);
            ulc.appendChild(tab.content);
        }
        return tabs;
    };
})();

//创建框架类
var Frame = (function() {

    return function(title, classname) {
        var frame = document.createElement("div");
        frame.className = "pubd-frame" + (classname ? " " + classname : "");

        var caption = document.createElement("div");
        caption.className = "pubd-frame-caption";
        caption.innerHTML = title;
        frame.caption = caption;
        frame.appendChild(caption);
        var content = document.createElement("div");
        content.className = "pubd-frame-content";
        frame.content = content;
        frame.appendChild(content);

        frame.name = function() {
            return this.caption.textContent;
        }
        frame.rename = function(newName) {
            if (typeof(newName) == "string" && newName.length > 0) {
                this.caption.innerHTML = newName;
                return true;
            } else
                return false;
        }

        return frame;
    };
})();

//创建带Label的Input类
var LabelInput = (function() {

    return function(text, classname, name, type, value, beforeText, title) {
        var label = document.createElement("label");
        label.innerHTML = text;
        label.className = classname;
        if (typeof(title) != "undefined")
            label.title = title;

        var ipt = document.createElement("input");
        ipt.name = name;
        ipt.id = ipt.name;
        ipt.type = type;
        ipt.value = value;

        label.input = ipt;
        if (beforeText)
            label.insertBefore(ipt, label.firstChild);
        else
            label.appendChild(ipt);
        return label;
    };
})();

//创建进度条类
var Progress = (function() {
    //强制保留pos位小数，如：2，会在2后面补上00.即2.00
    function toDecimal2(num, pos) {
        var f = parseFloat(num);
        if (isNaN(f)) {
            return false;
        }
        f = Math.round(num * Math.pow(10, pos)) / Math.pow(10, pos);
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

    return function(classname, align_right) {
        var progress = document.createElement("div");
        progress.className = "pubd-progress" + (classname ? " " + classname : "");
        if (align_right) progress.classList.add("pubd-progress-right");

        progress.scaleNum = 0;

        var bar = document.createElement("div");
        bar.className = "pubd-progress-bar";
        progress.appendChild(bar);

        var txt = document.createElement("span");
        txt.className = "pubd-progress-text";
        progress.appendChild(txt);

        progress.set = function(scale, pos, str) {
            if (!pos) pos = 2;
            var percentStr = toDecimal2((scale * 100), pos) + "%";
            scale = scale > 1 ? 1 : (scale < 0 ? 0 : scale);
            this.scaleNum = scale;
            bar.style.width = percentStr;
            if (str)
                txt.innerHTML = str;
            else
                txt.innerHTML = percentStr;
        }
        progress.scale = function() {
            return this.scaleNum;
        }

        return progress;
    };
})();

//创建用户卡片类
var UserCard = (function() {

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
        var dt = document.createElement("dt");
        dt.className = "pubd-user-info-id-dt";
        dt.innerHTML = "ID"
        infos.appendChild(dt);
        var dd = document.createElement("dd");
        dd.className = "pubd-user-info-id-dd";
        dd.innerHTML = uinfo.userid;
        uinfo.uid = dd;
        infos.appendChild(dd);
        //作品数
        var dt = document.createElement("dt");
        dt.className = "pubd-user-info-illusts-dt";
        dt.innerHTML = "作品投稿数"
        infos.appendChild(dt);
        var dd = document.createElement("dd");
        dd.className = "pubd-user-info-illusts-dd";
        uinfo.uillusts = dd;
        infos.appendChild(dd);
        //昵称
        var dt = document.createElement("dt");
        dt.className = "pubd-user-info-name-dt";
        dt.innerHTML = "昵称"
        infos.appendChild(dt);
        var dd = document.createElement("dd");
        dd.className = "pubd-user-info-name-dd";
        uinfo.uname = dd;
        infos.appendChild(dd);
        //收藏数
        var dt = document.createElement("dt");
        dt.className = "pubd-user-info-bookmarks-dt";
        dt.innerHTML = "公开收藏数"
        infos.appendChild(dt);
        var dd = document.createElement("dd");
        dd.className = "pubd-user-info-bookmarks-dd";
        uinfo.ubookmarks = dd;
        infos.appendChild(dd);

        uinfo.infos = infos;
        uinfo.appendChild(infos);

        uinfo.set = function(obj) {
            if (obj.id) {
                uinfo.userid = obj.id;
                uinfo.uid.innerHTML = obj.id;
            }
            if (obj.head) uinfo.uhead.src = obj.head;
            if (obj.name) uinfo.uname.innerHTML = obj.name;
            if (obj.illusts >= 0) uinfo.uillusts.innerHTML = obj.illusts;
            if (obj.bookmarks >= 0) uinfo.ubookmarks.innerHTML = obj.bookmarks;
        }
        return uinfo;
    };
})();

//创建下拉框类
var Select = (function() {
    return function(classname, name) {
        var select = document.createElement("select");
        select.className = "pubd-select" + (classname ? " " + classname : "");
        select.name = name;
        select.id = select.name;

        select.add = function(text, value) {
            var opt = new Option(text, value);
            this.options.add(opt);
        }
        select.remove = function(index) {
            this.options.remove(index);
        }

        return select;
    };
})();

//创建Aria2类
var Aria2 = (function() {
    var jsonrpc_version = '2.0';

    function get_auth(url) {
        return url.match(/^(?:(?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(?:\/\/)?(?:([^:@]*(?::[^:@]*)?)?@)?/)[1];
    };

    function request(jsonrpc_path, method, params, callback, priority) {
        if (callback == undefined) callback = function() { return; }
        var auth = get_auth(jsonrpc_path);
        jsonrpc_path = jsonrpc_path.replace(/^((?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(\/\/)?(?:(?:[^:@]*(?::[^:@]*)?)?@)?(.*)/, '$1$2$3'); // auth string not allowed in url for firefox

        var request_obj = {
            jsonrpc: jsonrpc_version,
            method: method,
            id: priority ? "1" : (new Date()).getTime().toString(),
        };
        if (params) request_obj['params'] = params;
        
        if (auth && auth.indexOf('token:') == 0)
        {
            if (method == "system.multicall")
            { //多项目操作时单独设置token
                params.forEach(function(param){
                    param.forEach(function(method){
                        method.params.unshift(auth);
                    })
                })
            }else
            {
                params.unshift(auth);
            }
        }

        var headers = { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", }
        if (auth && auth.indexOf('token:') != 0) {
            headers.Authorization = "Basic " + btoa(auth);
        }
        GM_xmlhttpRequest({
            url: jsonrpc_path + "?tm=" + (new Date()).getTime().toString(),
            method: "POST",
            responseType: "text",
            data: JSON.stringify(request_obj),
            headers: headers,
            onload: function(response) {
                try {
                    var JSONreq = JSON.parse(response.response);
                    callback(JSONreq);
                } catch (e) {
                    console.error("Aria2发送信息错误", e, response);
                    callback(false);
                }
            },
            onerror: function(response) {
                console.error(response);
                callback(false);
            }
        })
    };

    return function(jsonrpc_path) {
        _this = this;
        _this.jsonrpc_path = jsonrpc_path;
        _this.addUri = function(uri, options, callback) {
            request(_this.jsonrpc_path, 'aria2.addUri', [
                [uri, ], options
            ], callback);
        };
        _this.addTorrent = function(base64txt, options, callback) {
            request(_this.jsonrpc_path, 'aria2.addTorrent', [base64txt, [], options], callback);
        };
        _this.getVersion = function(callback) {
            request(_this.jsonrpc_path, 'aria2.getVersion', [], callback, true);
        };
        _this.getGlobalOption = function(callback) {
            request(_this.jsonrpc_path, 'aria2.getGlobalOption', [], callback, true);
        };
        _this.system = {
            multicall:function(params,callback){
                request(_this.jsonrpc_path, 'system.multicall', params, callback, true);
            },
        };
        return this;
    }
})();

/*
 * 自定义函数区
 */
//构建开始按钮
function buildbtnStart(touch) {
    if (touch) //手机版
    {

    } else {
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
        btnStart.addEventListener("click", function() { pubd.menu.classList.toggle("display-none") });
    }
    return btnStart;
}

//构建菜单
function buildbtnMenu(touch) {
    if (touch) //手机版
    {

    } else {
        /*
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
        */
        var menu = new pubdMenu(touch, "pubd-menu-main");
        menu.id = "pubd-menu";
        menu.add("下载该画师", "pubd-menu-this-user", function() {
            pubd.dialog.downthis.show();
            menu.hide();
        });
        /*
        menu.add("占位用","",null,menu1);
        menu.add("没功能","",null,menu4);
        menu.add("多个画师下载",null,function()
        		{//做成“声音”的设备样子
        			alert("这个功能也没有开发")
        		}
        	);
        */
        /*
        if (typeof(pixiv.context.illustId) != "undefined")
        { //需要子菜单，显示不同的下载方案
        menu.add("下载当前作品","",function()
        		{
        			pubd.dialog.downthis.show();
        			menu.hide();
        		}
        	);
        }
        if (typeof(pixiv.context.userId) != "undefined")
        {
        menu.add("收藏作者","",function()
        		{

        			pubd.staruser.push(pixiv.context.userId);
        			var starStr = JSON.stringify(pubd.staruser);
        			GM_setValue("pubd-staruser",starStr); //下载方案

        			menu.hide();
        		}
        	);
        }
        */
        menu.add(0);
        menu.add("选项", "pubd-menu-setting", function() {
            pubd.dialog.config.show();
            menu.hide();
        });
    }
    return menu;
}

//有默认值的获取设置
function getValueDefault(name, defaultValue) {
    var value = GM_getValue(name);
    if (value != undefined)
        return value;
    else
        return defaultValue;
}
//构建设置对话框
function buildDlgConfig(touch) {
    var dlg = new Dialog("PUBD选项 v" + scriptVersion, "pubd-config", "pubd-config");
    dlg.cptBtns.add("反馈", "dlg-btn-debug", "https://github.com/Mapaler/PixivUserBatchDownload/issues");
    dlg.cptBtns.add("？", "dlg-btn-help", "https://github.com/Mapaler/PixivUserBatchDownload/wiki");
    dlg.token_ani = null; //储存Token进度条动画句柄
    var dlgc = dlg.content;

    var dl = document.createElement("dl");
    dlgc.appendChild(dl);
    var dt = document.createElement("dt");
    dl.appendChild(dt);
    //dt.innerHTML = "Pixiv访问权限，默认仅能访问公开作品";
    var dd = document.createElement("dd");
    dl.appendChild(dd);

    var frm = new Frame("Pixiv访问权限", "pubd-token");
    dd.appendChild(frm);

    var dl_t = document.createElement("dl");
    frm.content.appendChild(dl_t);

    var dd = document.createElement("dd");
    dl_t.appendChild(dd);
    var checkbox = new LabelInput("开启登陆功能，解除浏览限制", "pubd-needlogin", "pubd-needlogin", "checkbox", "1", true);
    dlg.needlogin = checkbox.input;
    dlg.needlogin.onclick = function() {
        if (dlg.needlogin.checked) {
            dlg.token_info.classList.remove("height-none");
            dlg.start_token_animate();
        } else {
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
    var dd = document.createElement("dd");
    dl_t.appendChild(dd);
    dd.className = "pubd-token-info height-none";
    dlg.token_info = dd;
    var progress = new Progress("pubd-token-expires", true);
    dlg.token_expires = progress;
    dd.appendChild(progress);
    //开始动画
    dlg.start_token_animate = function() {
            //if (!dlg.classList.contains("display-none"))
            //{
            dlg.stop_token_animate();
            requestAnimationFrame(token_animate);
            dlg.token_ani = setInterval(function() { requestAnimationFrame(token_animate) }, 1000);
            //}
        }
        //停止动画
    dlg.stop_token_animate = function() {
            clearInterval(dlg.token_ani);
        }
        //动画具体实现
    function token_animate() {
        var nowdate = new Date();
        var olddate = new Date(pubd.auth.login_date);
        var expires_in = parseInt(pubd.auth.response.expires_in);
        var differ = expires_in - (nowdate - olddate) / 1000;
        var scale = differ / expires_in;
        if (differ > 0) {
            progress.set(scale, 2, "Token有效剩余" + parseInt(differ) + "秒");
        } else {
            progress.set(0, 2, "Token已失效，请重新登录");
            clearInterval(dlg.token_ani);
        }
        //console.log("Token有效剩余" + differ + "秒"); //检测动画后台是否停止
    }

    var ipt = document.createElement("input");
    ipt.type = "button";
    ipt.className = "pubd-tologin";
    ipt.value = "账户登陆"
    ipt.onclick = function() {
        pubd.dialog.login.show();
    }
    dd.appendChild(ipt);

    //“通用分析选项”窗口选项
    var dt = document.createElement("dt");
    dl.appendChild(dt);
    var dd = document.createElement("dd");

    var frm = new Frame("通用分析选项", "pubd-commonanalyseoptions");
    var chk_getugoiraframe = new LabelInput("获取动图帧数", "pubd-getugoiraframe", "pubd-getugoiraframe", "checkbox", "1", true);
    dlg.getugoiraframe = chk_getugoiraframe.input;

    frm.content.appendChild(chk_getugoiraframe);
    dd.appendChild(frm);
    dl.appendChild(dd);

    //“下载该画师”窗口选项
    var dt = document.createElement("dt");
    dl.appendChild(dt);
    var dd = document.createElement("dd");

    var frm = new Frame("“下载该画师”窗口", "pubd-frm-downthis");
    var chk_autoanalyse = new LabelInput("打开窗口时自动获取", "pubd-autoanalyse", "pubd-autoanalyse", "checkbox", "1", true);
    dlg.autoanalyse = chk_autoanalyse.input;
    var chk_autodownload = new LabelInput("获取完成后自动发送", "pubd-autodownload", "pubd-autodownload", "checkbox", "1", true);
    dlg.autodownload = chk_autodownload.input;

    frm.content.appendChild(chk_autoanalyse);
    frm.content.appendChild(chk_autodownload);
    dd.appendChild(frm);
    dl.appendChild(dd);

    //向Aria2的发送模式
    var dt = dl.appendChild(document.createElement("dt"));
    var dd = dl.appendChild(document.createElement("dd"));

    var frm = dd.appendChild(new Frame("向Aria2逐项发送模式", "pubd-frm-termwisetype"));
    var radio0 = frm.content.appendChild(new LabelInput("完全逐项（按图片）", "pubd-termwisetype", "pubd-termwisetype", "radio", "0", true));
    var radio1 = frm.content.appendChild(new LabelInput("半逐项（按作品）", "pubd-termwisetype", "pubd-termwisetype", "radio", "1", true));
    var radio2 = frm.content.appendChild(new LabelInput("不逐项（按作者）", "pubd-termwisetype", "pubd-termwisetype", "radio", "2", true));
    dlg.termwiseType = [radio0.input, radio1.input, radio2.input];

    //“发送完成后，点击通知”窗口选项
    var dt = dl.appendChild(document.createElement("dt"));
    var dd = dl.appendChild(document.createElement("dd"));

    var frm = dd.appendChild(new Frame("发送完成通知", "pubd-frm-clicknotification"));
    var radio0 = frm.content.appendChild(new LabelInput("点击通知什么也不做", "pubd-clicknotification", "pubd-clicknotification", "radio", "0", true));
    var radio1 = frm.content.appendChild(new LabelInput("点击通知激活该窗口", "pubd-clicknotification", "pubd-clicknotification", "radio", "1", true));
    var radio2 = frm.content.appendChild(new LabelInput("点击通知关闭该窗口", "pubd-clicknotification", "pubd-clicknotification", "radio", "2", true));
    var radio3 = frm.content.appendChild(new LabelInput("通知自动消失关闭该窗口", "pubd-clicknotification", "pubd-clicknotification", "radio", "3", true));
    dlg.noticeType = [radio0.input, radio1.input, radio2.input, radio3.input];

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
    dlg.schemes = null;
    dlg.reloadSchemes = function() { //重新读取所有下载方案
        if (dlg.schemes.length < 1) {
            alert("目前本程序没有任何下载方案，需要正常使用请先新建方案。");
        }
        dlg.downScheme.options.length = 0;
        dlg.schemes.forEach(function(item, index) {
            dlg.downScheme.add(item.name, index);
        })
        if (dlg.downScheme.options.length > 0)
            dlg.selectScheme(0);
    }
    dlg.loadScheme = function(scheme) { //读取一个下载方案
        if (scheme == undefined) {
            dlg.rpcurl.value = "";
            dlg.https2http.checked = false;
            dlg.downfilter.value = "";
            dlg.savedir.value = "";
            dlg.savepath.value = "";
            dlg.textout.value = "";
            dlg.loadMasklistFromArray([]);
        } else {
            dlg.rpcurl.value = scheme.rpcurl;
            dlg.https2http.checked = scheme.https2http;
            dlg.downfilter.value = scheme.downfilter;
            dlg.savedir.value = scheme.savedir;
            dlg.savepath.value = scheme.savepath;
            dlg.textout.value = scheme.textout;
            dlg.loadMasklistFromArray(scheme.masklist);
        }
    }
    dlg.addMask = function(name, logic, content, value) { //向掩码列表添加一个新的掩码
        if (value == undefined)
            value = dlg.masklist.options.length;
        var text = name + " : " + logic + " : " + content;
        var opt = new Option(text, value);
        dlg.masklist.options.add(opt);
    }
    dlg.loadMask = function(mask) { //读取一个掩码到三个文本框，只是用来查看
        dlg.mask_name.value = mask.name;
        dlg.mask_logic.value = mask.logic;
        dlg.mask_content.value = mask.content;
    }
    dlg.loadMasklistFromArray = function(masklist) { //从掩码数组重置掩码列表
            dlg.masklist.length = 0;
            masklist.forEach(function(item, index) {
                dlg.addMask(item.name, item.logic, item.content, index);
            })
        }
        //选择一个方案，同时读取设置
    dlg.selectScheme = function(index) {
            if (index == undefined) index = 0;
            if (dlg.downScheme.options.length < 1 || dlg.downScheme.selectedOptions.length < 1) { return; }
            var scheme = dlg.schemes[index];
            dlg.loadScheme(scheme);
            dlg.downScheme.selectedIndex = index;
        }
        //选择一个掩码，同时读取设置
    dlg.selectMask = function(index) {
        if (dlg.downScheme.options.length < 1 || dlg.downScheme.selectedOptions.length < 1) { return; }
        if (dlg.masklist.options.length < 1 || dlg.masklist.selectedOptions.length < 1) { return; }
        var scheme = dlg.schemes[dlg.downScheme.selectedIndex];
        var mask = scheme.masklist[index];
        dlg.loadMask(mask);
        dlg.masklist.selectedIndex = index;
    }

    //配置方案选择
    var dt = document.createElement("dt");
    dt.innerHTML = "默认下载方案";
    dl.appendChild(dt);
    var dd = document.createElement("dd");
    var slt = new Select("pubd-downscheme");
    slt.onchange = function() {
        dlg.selectScheme(this.selectedIndex);
    };
    dlg.downScheme = slt;
    dd.appendChild(slt);

    var ipt = document.createElement("input");
    ipt.type = "button";
    ipt.className = "pubd-downscheme-new";
    ipt.value = "新建"
    ipt.onclick = function() {
        var schemName = prompt("请输入方案名", "我的方案");
        if (schemName)
        {
            var scheme = new DownScheme(schemName);
            var length = dlg.schemes.push(scheme);
            dlg.downScheme.add(scheme.name, length - 1);
            dlg.downScheme.selectedIndex = length - 1;
            dlg.loadScheme(scheme);
            //dlg.reloadSchemes();
        }
    }
    dd.appendChild(ipt);

    var ipt = document.createElement("input");
    ipt.type = "button";
    ipt.className = "pubd-downscheme-remove";
    ipt.value = "删除"
    ipt.onclick = function() {
        if (dlg.downScheme.options.length < 1) { alert("已经没有方案了"); return; }
        if (dlg.downScheme.selectedOptions.length < 1) { alert("没有选中方案"); return; }
        var index = dlg.downScheme.selectedIndex;
        dlg.schemes.splice(index, 1);
        dlg.downScheme.remove(index);
        var index = dlg.downScheme.selectedIndex;
        if (index < 0) dlg.reloadSchemes(); //没有选中的，重置
        else dlg.loadScheme(dlg.schemes[index]);
    }
    dd.appendChild(ipt);
    dl.appendChild(dd);

    //配置方案详情设置
    var dt = document.createElement("dt");
    dl.appendChild(dt);
    var dd = document.createElement("dd");
    dd.className = "pubd-selectscheme-bar";

    var frm = new Frame("当前方案设置", "pubd-selectscheme");

    var dl_ss = document.createElement("dl");

    frm.content.appendChild(dl_ss);
    dd.appendChild(frm);
    dl.appendChild(dd);

    //Aria2 URL

    var dt = document.createElement("dt");
    dl_ss.appendChild(dt);
    dt.innerHTML = "Aria2 JSON-RPC 路径"
    var rpcchk = document.createElement("span"); //显示检查状态用
    rpcchk.className = "pubd-rpcchk-info";
    dlg.rpcchk = rpcchk;
    dlg.rpcchk.runing = false;
    dt.appendChild(rpcchk);
    var dd = document.createElement("dd");
    var rpcurl = document.createElement("input");
    rpcurl.type = "url";
    rpcurl.className = "pubd-rpcurl";
    rpcurl.name = "pubd-rpcurl";
    rpcurl.id = rpcurl.name;
    rpcurl.placeholder = "Aria2的信息接收路径"
    rpcurl.onchange = function() {
        dlg.rpcchk.innerHTML = "";
        dlg.rpcchk.runing = false;
        if (dlg.downScheme.selectedOptions.length < 1) { return; }
        var schemeIndex = dlg.downScheme.selectedIndex;
        dlg.schemes[schemeIndex].rpcurl = rpcurl.value;
    }
    dlg.rpcurl = rpcurl;
    dd.appendChild(rpcurl);

    var ipt = document.createElement("input");
    ipt.type = "button";
    ipt.className = "pubd-rpcchk";
    ipt.value = "检查路径"
    ipt.onclick = function() {
        if (dlg.rpcchk.runing) return;
        if (dlg.rpcurl.value.length < 1) {
            dlg.rpcchk.innerHTML = "路径为空";
            return;
        }
        dlg.rpcchk.innerHTML = "正在连接...";
        dlg.rpcchk.runing = true;
        var aria2 = new Aria2(dlg.rpcurl.value);
        aria2.getVersion(function(rejo) {
            if (rejo)
                dlg.rpcchk.innerHTML = "发现Aria2 ver" + rejo.result.version;
            else
                dlg.rpcchk.innerHTML = "Aria2连接失败";
            dlg.rpcchk.runing = false;
        });
    }
    dd.appendChild(ipt);
    dl_ss.appendChild(dd);

    //额外设置，https转http
    var dt = document.createElement("dt");
    dl_ss.appendChild(dt);
    var dd = document.createElement("dd");
    var chk_https2http = new LabelInput("图片网址https转http", "pubd-https2http", "pubd-https2http", "checkbox", "1", true, "某些Linux没有正确安装新版OpenSSL，https的图片链接会下载失败。");
    dlg.https2http = chk_https2http.input;
    dlg.https2http.onchange = function() {
        if (dlg.downScheme.selectedOptions.length < 1) { return; }
        var schemeIndex = dlg.downScheme.selectedIndex;
        dlg.schemes[schemeIndex].https2http = this.checked;
    }
    dd.appendChild(chk_https2http);
    dl_ss.appendChild(dd);

    //下载过滤
    var dt = document.createElement("dt");
    dl_ss.appendChild(dt);
    dt.innerHTML = "下载过滤器"
    var dd = document.createElement("dd");
    var downfilter = document.createElement("input");
    downfilter.type = "text";
    downfilter.className = "pubd-downfilter";
    downfilter.name = "pubd-downfilter";
    downfilter.id = downfilter.name;
    downfilter.placeholder = "符合条件的图片将不会被发送到Aria2"
    downfilter.onchange = function() {
        if (dlg.downScheme.selectedOptions.length < 1) { return; }
        var schemeIndex = dlg.downScheme.selectedIndex;
        dlg.schemes[schemeIndex].downfilter = downfilter.value;
    }
    dlg.downfilter = downfilter;
    dd.appendChild(downfilter);
    dl_ss.appendChild(dd);

    //下载目录
    var dt = document.createElement("dt");
    dl_ss.appendChild(dt);
    dt.innerHTML = "下载目录"
    var dd = document.createElement("dd");
    var savedir = document.createElement("input");
    savedir.type = "text";
    savedir.className = "pubd-savedir";
    savedir.name = "pubd-savedir";
    savedir.id = savedir.name;
    savedir.placeholder = "文件下载到的目录"
    savedir.onchange = function() {
        if (dlg.downScheme.selectedOptions.length < 1) { return; }
        var schemeIndex = dlg.downScheme.selectedIndex;
        dlg.schemes[schemeIndex].savedir = savedir.value;
    }
    dlg.savedir = savedir;
    dd.appendChild(savedir);
    dl_ss.appendChild(dd);

    //保存路径
    var dt = document.createElement("dt");
    dl_ss.appendChild(dt);
    dt.innerHTML = "保存路径"
    var dd = document.createElement("dd");
    var savepath = document.createElement("input");
    savepath.type = "text";
    savepath.className = "pubd-savepath";
    savepath.name = "pubd-savepath";
    savepath.id = savepath.name;
    savepath.placeholder = "分组保存的文件夹和文件名"
    savepath.onchange = function() {
        if (dlg.downScheme.selectedOptions.length < 1) { return; }
        var schemeIndex = dlg.downScheme.selectedIndex;
        dlg.schemes[schemeIndex].savepath = savepath.value;
    }
    dlg.savepath = savepath;
    dd.appendChild(savepath);
    dl_ss.appendChild(dd);

    //输出文本
    var dt = document.createElement("dt");
    dl_ss.appendChild(dt);
    dt.innerHTML = "文本输出模式格式"
    var dd = document.createElement("dd");
    dd.className = "pubd-textout-bar";
    var textout = document.createElement("textarea");
    textout.className = "pubd-textout";
    textout.name = "pubd-textout";
    textout.id = textout.name;
    textout.placeholder = "直接输出文本信息时的格式"
    textout.wrap = "off";
    textout.onchange = function() {
        if (dlg.downScheme.selectedOptions.length < 1) { return; }
        var schemeIndex = dlg.downScheme.selectedIndex;
        dlg.schemes[schemeIndex].textout = textout.value;
    }
    dlg.textout = textout;
    dd.appendChild(textout);
    dl_ss.appendChild(dd);


    //自定义掩码
    var dt = document.createElement("dt");
    dl_ss.appendChild(dt);
    dt.innerHTML = "自定义掩码"
    var dd = document.createElement("dd");
    dl_ss.appendChild(dd);
    //▼掩码名
    var ipt = document.createElement("input");
    ipt.type = "text";
    ipt.className = "pubd-mask-name";
    ipt.name = "pubd-mask-name";
    ipt.id = ipt.name;
    ipt.placeholder = "自定义掩码名";
    dlg.mask_name = ipt;
    dd.appendChild(ipt);
    //▲掩码名
    //▼执行条件
    var ipt = document.createElement("input");
    ipt.type = "text";
    ipt.className = "pubd-mask-logic";
    ipt.name = "pubd-mask-logic";
    ipt.id = ipt.name;
    ipt.placeholder = "执行条件";
    dlg.mask_logic = ipt;
    dd.appendChild(ipt);
    //▲执行条件
    var ipt = document.createElement("input");
    ipt.type = "button";
    ipt.className = "pubd-mask-add";
    ipt.value = "+";
    ipt.onclick = function() { //增加自定义掩码
        if (dlg.downScheme.selectedOptions.length < 1) { alert("没有选中下载方案"); return; }
        if (dlg.mask_name.value.length < 1) { alert("掩码名称为空"); return; }
        if (dlg.mask_logic.value.length < 1) { alert("执行条件为空"); return; }
        if (dlg.mask_content.value.indexOf("%{" + dlg.mask_logic.value + "}")>=0) { alert("该掩码调用自身，会形成死循环。"); return; }
        var schemeIndex = dlg.downScheme.selectedIndex;
        dlg.schemes[schemeIndex].mask.add(dlg.mask_name.value, dlg.mask_logic.value, dlg.mask_content.value);
        dlg.addMask(dlg.mask_name.value, dlg.mask_logic.value, dlg.mask_content.value);
        dlg.mask_name.value = dlg.mask_logic.value = dlg.mask_content.value = "";
    }
    dd.appendChild(ipt);
    var mask_remove = document.createElement("input");
    mask_remove.type = "button";
    mask_remove.className = "pubd-mask-remove";
    mask_remove.value = "-";
    mask_remove.onclick = function() { //删除自定义掩码
        if (dlg.downScheme.selectedOptions.length < 1) { alert("没有选中下载方案"); return; }
        if (dlg.masklist.options.length < 1) { alert("已经没有掩码了"); return; }
        if (dlg.masklist.selectedOptions.length < 1) { alert("没有选中掩码"); return; }
        var schemeIndex = dlg.downScheme.selectedIndex;
        var maskIndex = dlg.masklist.selectedIndex;
        dlg.schemes[schemeIndex].mask.remove(maskIndex);
        dlg.masklist.remove(maskIndex);
        for (var mi = maskIndex; mi < dlg.masklist.options.length; mi++) {
            dlg.masklist.options[mi].value = mi;
        }
    }
    dd.appendChild(mask_remove);

    //▼掩码内容
    var ipt = document.createElement("input");
    ipt.type = "text";
    ipt.className = "pubd-mask-content";
    ipt.name = "pubd-mask-content";
    ipt.id = ipt.name;
    ipt.placeholder = "掩码内容";
    dlg.mask_content = ipt;
    dd.appendChild(ipt);
    //▲掩码内容
    dl_ss.appendChild(dd);

    //▼掩码列表
    var dd = document.createElement("dd");
    dd.className = "pubd-mask-list-bar";
    var masklist = new Select("pubd-mask-list", "pubd-mask-list")
    masklist.size = 5;
    masklist.onchange = function() { //读取选中的掩码
        dlg.selectMask(this.selectedIndex);
    }
    dlg.masklist = masklist;
    dd.appendChild(masklist);
    //▲掩码列表
    dl_ss.appendChild(dd);

    //保存按钮栏
    var dt = document.createElement("dt");
    dl.appendChild(dt);
    var dd = document.createElement("dd");
    dd.className = "pubd-config-savebar"
    var ipt = document.createElement("input");
    ipt.type = "button";
    ipt.className = "pubd-reset";
    ipt.value = "清空选项"
    ipt.onclick = function() {
        dlg.reset();
    }
    dd.appendChild(ipt);
    var ipt = document.createElement("input");
    ipt.type = "button";
    ipt.className = "pubd-save";
    ipt.value = "保存选项"
    ipt.onclick = function() {
        dlg.save();
    }
    dd.appendChild(ipt);
    dl.appendChild(dd);

    //保存设置函数
    dlg.save = function() {
            pubd.auth.needlogin = dlg.needlogin.checked;
            pubd.auth.save();

            //作品发送完成后，如何处理通知
            var noticeType = 0;
            dlg.noticeType.some(function(item){
                if (item.checked) noticeType = item.value;
                return item.checked;
            });
            //逐项发送模式
            var termwiseType = 0;
            dlg.termwiseType.some(function(item){
                if (item.checked) termwiseType = item.value;
                return item.checked;
            });

            GM_setValue("pubd-getugoiraframe", dlg.getugoiraframe.checked); //获取动图帧数
            GM_setValue("pubd-autoanalyse", dlg.autoanalyse.checked); //自动分析
            GM_setValue("pubd-autodownload", dlg.autodownload.checked); //自动下载
            GM_setValue("pubd-noticeType", noticeType); //处理通知
            GM_setValue("pubd-termwiseType", termwiseType); //逐项发送
            GM_setValue("pubd-downschemes", JSON.stringify(dlg.schemes)); //下载方案
            GM_setValue("pubd-defaultscheme", dlg.downScheme.selectedIndex); //默认方案
            GM_setValue("pubd-configversion", pubd.configVersion); //设置版本

            GM_notification({text:"设置已保存", title:scriptName, image:scriptIcon});
            pubd.downSchemes = NewDownSchemeArrayFromJson(dlg.schemes);
            pubd.dialog.downthis.reloadSchemes();
        }
        //重置设置函数
    dlg.reset = function() {
            GM_deleteValue("pubd-auth"); //登陆相关信息
            GM_deleteValue("pubd-getugoiraframe"); //获取动图帧数
            GM_deleteValue("pubd-autoanalyse"); //自动分析
            GM_deleteValue("pubd-autodownload"); //自动下载
            GM_deleteValue("pubd-noticeType"); //处理通知
            GM_deleteValue("pubd-termwiseType"); //逐项发送
            GM_deleteValue("pubd-downschemes"); //下载方案
            GM_deleteValue("pubd-defaultscheme"); //默认方案
            GM_deleteValue("pubd-configversion"); //设置版本
            GM_notification({text:"已清空重置设置", title:scriptName, image:scriptIcon});
        }
        //窗口关闭
    dlg.close = function() {
        dlg.stop_token_animate();
    };
    //关闭窗口按钮
    dlg.cptBtns.close.addEventListener("click", dlg.close);
    //窗口初始化
    dlg.initialise = function() {
        dlg.needlogin.checked = pubd.auth.needlogin;
        if (pubd.auth.needlogin) //如果要登陆，就显示Token区域，和动画
        {
            dlg.token_info.classList.remove("height-none");
            dlg.start_token_animate();
        } else {
            dlg.token_info.classList.add("height-none");
        }

        dlg.getugoiraframe.checked = getValueDefault("pubd-getugoiraframe", true);
        dlg.autoanalyse.checked = getValueDefault("pubd-autoanalyse", false);
        dlg.autodownload.checked = getValueDefault("pubd-autodownload", false);
        (dlg.noticeType[parseInt(getValueDefault("pubd-noticeType", 0))] || dlg.noticeType[0]).checked = true;
        (dlg.termwiseType[parseInt(getValueDefault("pubd-termwiseType", 0))] || dlg.termwiseType[0]).checked = true;

        //pubd.downSchemes = NewDownSchemeArrayFromJson(getValueDefault("pubd-downschemes",0)); //重新读取下载方案（可能被其他页面修改的）
        dlg.schemes = NewDownSchemeArrayFromJson(pubd.downSchemes);
        dlg.reloadSchemes();
        dlg.selectScheme(getValueDefault("pubd-defaultscheme", 0));
        //ipt_token.value = pubd.auth.response.access_token;
    };
    return dlg;
}

//重新登陆
function reLogin(onload_suceess_Cb)
{
    var dlgLogin = pubd.dialog.login;
    if (pubd.auth.save_account) {
        dlgLogin.show();
        dlgLogin.error.replace("正在自动登陆");

        pubd.auth.login(
            function(jore) { //onload_suceess_Cb
                dlgLogin.error.replace("登录成功");
                //pubd.dialog.config.start_token_animate();
                dlgLogin.cptBtns.close.click();

                //如果设置窗口运行着的话还启动动画
                if (!pubd.dialog.config.classList.contains("display-none"))
                    pubd.dialog.config.start_token_animate();
                //调用成功后函数
                onload_suceess_Cb(jore);
            },
            function(jore) { //onload_haserror_Cb //返回错误消息
                dlgLogin.error.replace(["错误代码：" + jore.errors.system.code, jore.errors.system.message]);
            },
            function(re) { //onload_notjson_Cb //返回不是JSON
                dlgLogin.error.replace("返回不是JSON，或程序异常");
            },
            function(re) { //onerror_Cb //AJAX发送失败
                dlgLogin.error.replace("AJAX发送失败");
            }
        );
    }else
    {
        dlgLogin.error.replace("请手动登陆后重新执行");
    }
}

//构建登陆对话框
function buildDlgLogin(touch) {
    var dlg = new Dialog("登陆账户", "pubd-login", "pubd-login");

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
    pid.placeholder = "邮箱地址/pixiv ID";
    dlg.pid = pid;
    input_field1.appendChild(pid);
    input_field_group.appendChild(input_field1);
    var input_field2 = document.createElement("div");
    input_field2.className = "input-field";
    var pass = document.createElement("input");
    pass.type = "password";
    pass.className = "pubd-password";
    pass.name = "pubd-password";
    pass.id = pass.name;
    pass.placeholder = "密码";
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
    var checkbox = new LabelInput("记住账号密码（警告：明文保存于本地）", "pubd-remember", "pubd-remember", "checkbox", "1", true);
    dlg.remember = checkbox.input;
    signup_form_nav.appendChild(checkbox);
    dlgc.appendChild(container_login);

    submit.onclick = function() {
            dlg.error.replace("登陆中···");

            pubd.auth.newAccount(pid.value, pass.value, dlg.remember.checked);

            pubd.auth.login(
                function(jore) { //onload_suceess_Cb
                    dlg.error.replace("登陆成功");
                    pubd.dialog.config.start_token_animate();
                },
                function(jore) { //onload_haserror_Cb //返回错误消息
                    dlg.error.replace(["错误代码：" + jore.errors.system.code, jore.errors.system.message]);
                },
                function(re) { //onload_notjson_Cb //返回不是JSON
                    dlg.error.replace("返回不是JSON，或程序异常");
                },
                function(re) { //onerror_Cb //AJAX发送失败
                    dlg.error.replace("AJAX发送失败");
                }
            );
        }
        //添加错误功能
    error_msg_list.clear = function() {
        this.innerHTML = ""; //清空当前信息
    }
    error_msg_list.add = function(text) {
        var error_msg_list_item = document.createElement("li");
        error_msg_list_item.className = "error-msg-list-item";
        error_msg_list_item.innerHTML = text;
        this.appendChild(error_msg_list_item);
    }
    error_msg_list.adds = function(arr) {
        arr.forEach(
            function(item) {
                error_msg_list.add(item);
            }
        )
    }
    error_msg_list.replace = function(text) {
        this.clear();
        if (typeof(text) == "object") //数组
            this.adds(text);
        else //单文本
            this.add(text);
    }
    dlg.error = error_msg_list;
    //窗口关闭
    dlg.close = function() {
        pubd.auth.newAccount(pid.value, pass.value, dlg.remember.checked);
        pubd.auth.save();
    };
    //关闭窗口按钮
    dlg.cptBtns.close.addEventListener("click", dlg.close);
    //窗口初始化
    dlg.initialise = function() {
        dlg.remember.checked = pubd.auth.save_account;
        pid.value = pubd.auth.username || "";
        pass.value = pubd.auth.password || "";
        error_msg_list.clear();
    };
    return dlg;
}


//构建当前画师下载对话框
function buildDlgDownThis(touch, userid) {
    var dlg = new Dialog("下载当前画师", "pubd-downthis", "pubd-downthis");
    dlg.user = new UserInfo();
    dlg.works = null; //当前处理对象

    var dlgc = dlg.content;

    var dl = document.createElement("dl");
    dlgc.appendChild(dl);

    var dt = document.createElement("dt");
    dl.appendChild(dt);
    dt.innerHTML = "" //用户头像等信息
    var dd = document.createElement("dd");

    var uinfo = new UserCard(userid ? userid : thisPageUserid); //创建当前用户信息卡

    dlg.uinfo = uinfo;
    dd.appendChild(uinfo);
    dl.appendChild(dd);

    var dt = document.createElement("dt");
    dl.appendChild(dt);
    dt.innerHTML = ""
    var dd = document.createElement("dd");

    var frm = new Frame("下载内容");
    var radio1 = new LabelInput("他的作品", "pubd-down-content", "pubd-down-content", "radio", "0", true);
    var radio2 = new LabelInput("他的收藏", "pubd-down-content", "pubd-down-content", "radio", "1", true);
    dlg.dcType = [radio1.input, radio2.input];
    radio1.input.onclick = function() { reAnalyse(this) };
    radio2.input.onclick = function() { reAnalyse(this) };

    function reAnalyse(radio) {
        if (radio.checked == true) {
            if (radio.value == 0)
                dlg.user.bookmarks.break = true; //radio值为0，使收藏中断
            else
                dlg.user.illusts.break = true; //radio值为1，使作品中断

            dlg.analyse(radio.value, dlg.uinfo.userid);
        }
    }
    frm.content.appendChild(radio1);
    frm.content.appendChild(radio2);

    dd.appendChild(frm);
    dl.appendChild(dd);

    var dt = document.createElement("dt");
    dl.appendChild(dt);
    dt.innerHTML = "信息获取进度"
    var dd = document.createElement("dd");
    var progress = new Progress("pubd-downthis-progress");
    dlg.progress = progress;
    dd.appendChild(progress);
    dl.appendChild(dd);

    var dt = document.createElement("dt");
    dl.appendChild(dt);
    dt.innerHTML = "进程日志"

    var btnBreak = document.createElement("input");
    btnBreak.type = "button";
    btnBreak.className = "pubd-breakdown";
    btnBreak.value = "中断操作";
    btnBreak.onclick = function() {
        dlg.user.illusts.break = true; //使作品中断
        dlg.user.bookmarks.break = true; //使收藏中断
        pubd.downbreak = true; //使下载中断
    }
    dt.appendChild(btnBreak);
    var dd = document.createElement("dd");
    var ipt = document.createElement("textarea");
    ipt.readOnly = true;
    ipt.className = "pubd-downthis-log";
    ipt.wrap = "off";
    dlg.logTextarea = ipt;
    dd.appendChild(ipt);
    dl.appendChild(dd);

    //下载方案
    dlg.schemes = null;

    dlg.reloadSchemes = function() { //重新读取所有下载方案
        dlg.schemes = pubd.downSchemes;

        dlg.downScheme.options.length = 0;
        dlg.schemes.forEach(function(item, index) {
            dlg.downScheme.add(item.name, index);
        })
        if (getValueDefault("pubd-defaultscheme",0) >= 0)
            dlg.selectScheme(getValueDefault("pubd-defaultscheme",0));
        else if (dlg.downScheme.options.length > 0)
            dlg.selectScheme(0);
    }

    //选择一个方案，同时读取设置
    dlg.selectScheme = function(index) {
        if (index == undefined) index = 0;
        if (dlg.downScheme.options.length < 1 || dlg.downScheme.selectedOptions.length < 1) { return; }
        dlg.downScheme.selectedIndex = index;
    }

    var dt = document.createElement("dt");
    dl.appendChild(dt);
    dt.innerHTML = "选择下载方案"
    var dd = document.createElement("dd");
    var slt = new Select("pubd-downscheme");
    dlg.downScheme = slt;
    dd.appendChild(slt);
    dl.appendChild(dd);

    //下载按钮栏
    var dt = document.createElement("dt");
    dl.appendChild(dt);
    var dd = document.createElement("dd");
    dd.className = "pubd-downthis-downbar"

    var textdown = document.createElement("input");
    textdown.type = "button";
    textdown.className = "pubd-textdown";
    textdown.value = "输出\n文本";
    textdown.onclick = function() {
        dlg.textdownload();
    }
    textdown.disabled = true;
    dlg.textdown = textdown;
    dd.appendChild(textdown);

    var startdown = document.createElement("input");
    startdown.type = "button";
    startdown.className = "pubd-startdown";
    startdown.value = "发送到Aria2";
    startdown.onclick = function() {
        dlg.startdownload();
    }
    startdown.disabled = true;
    dlg.startdown = startdown;
    dd.appendChild(startdown);
    dl.appendChild(dd);

    //文本输出栏
    var dt = document.createElement("dt");
    dl.appendChild(dt);
    var dd = document.createElement("dd");
    dd.className = "pubd-downthis-textout-bar"
    dl.appendChild(dd);

    var ipt = document.createElement("textarea");
    ipt.readOnly = true;
    ipt.className = "pubd-downthis-textout display-none";
    ipt.wrap = "off";
    dlg.textoutTextarea = ipt;
    dd.appendChild(ipt);

    //显示日志相关
    dlg.logArr = []; //用于储存一行一行的日志信息。
    dlg.logClear = function() {
        dlg.logArr.length = 0;
        this.logTextarea.value = "";
    };
    dlg.log = function(text) {
        dlg.logArr.push(text);
        this.logTextarea.value = this.logArr.join("\n");
        this.logTextarea.scrollTop = this.logTextarea.scrollHeight;
    };

    function xhrGenneral(url, onload_suceess_Cb, onload_hasError_Cb, onload_notJson_Cb, onerror_Cb) {
        var headersObj = new HeadersObject();
        var auth = pubd.auth;
        if (auth.needlogin) {
            var token_type = auth.response.token_type.substring(0, 1).toUpperCase() + auth.response.token_type.substring(1);
            headersObj.Authorization = token_type + " " + auth.response.access_token;
        } else {
            console.info("非登录模式获取信息");
        }
        GM_xmlhttpRequest({
            url: url,
            method: "get",
            responseType: "text",
            headers: headersObj,
            onload: function(response) {
                try {
                    var jo = JSON.parse(response.responseText);
                    if (jo.error) {
                        console.error(
                            jo.error.message.indexOf("Error occurred at the OAuth process.") >= 0?
                            "Token过期或错误":"错误：返回错误消息",
                            jo, response);
                        //jo.error.message 是JSON字符串的错误信息，Token错误的时候返回的又是普通字符串
                        //jo.error.user_message 是单行文本的错误信息
                        onload_hasError_Cb(jo);
                    } else { //登陆成功
                        //console.info("JSON返回成功",jo);
                        onload_suceess_Cb(jo);
                    }
                } catch (e) {
                    console.error("错误：返回可能不是JSON，或程序异常", e, response);
                    onload_notJson_Cb(response);
                }
            },
            onerror: function(response) {
                console.error("错误：AJAX发送失败", response);
                onerror_Cb(response);
            }
        })
    }

    //分析
    dlg.analyse = function(contentType, userid) {
            if (!userid) {dlg.log("错误：没有用户ID。"); return;}
            contentType = contentType == undefined ? 0 : parseInt(contentType);
            var works = contentType == 0 ? dlg.user.illusts : dlg.user.bookmarks; //将需要分析的数据储存到works里
            dlg.works = works;

            if (works.runing) {
                dlg.log("已经在进行分析操作了");
                return;
            }
            works.break = false; //暂停flag为false
            works.runing = true; //运行状态为true

            dlg.textdown.disabled = true; //禁用下载按钮
            dlg.startdown.disabled = true; //禁用输出文本按钮
            dlg.progress.set(0); //进度条归零
            dlg.logClear(); //清空日志

            //根据用户信息是否存在，决定分析用户还是图像
            if (!dlg.user.done) {
                startAnalyseUser(userid, contentType);
            } else {
                dlg.log("ID：" + userid + " 用户信息已存在");
                startAnalyseWorks(dlg.user, contentType); //开始获取第一页
            }

            function startAnalyseUser(userid, contentType) {
                try { //为了避免不同网页重复获取Token，开始分析前先读取储存的Token。
                    pubd.auth.loadFromResponse(JSON.parse(GM_getValue("pubd-auth")));
                } catch (e) {
                    console.error("开始分析前，重新读取登录信息失败", e);
                }

                dlg.log("开始获取ID为 " + userid + " 的用户信息");
                xhrGenneral(
                    "https://app-api.pixiv.net/v1/user/detail?user_id=" + userid,
                    function(jore) { //onload_suceess_Cb
                        works.runing = true;
                        dlg.user.done = true;
                        dlg.user.info = Object.assign(dlg.user.info, jore);
                        dlg.uinfo.set({
                            head: jore.user.profile_image_urls.medium,
                            name: jore.user.name,
                            illusts: jore.profile.total_illusts + jore.profile.total_manga,
                            bookmarks: jore.profile.total_illust_bookmarks_public,
                        });
                        startAnalyseWorks(dlg.user, contentType); //分析完成后开始获取第一页
                    },
                    function(jore) { //onload_haserror_Cb //返回错误消息
                        works.runing = false;
                        //下面开始自动登陆
                        if (jore.error.message.indexOf("Error occurred at the OAuth process.") >= 0) {
                            dlg.log("Token过期或错误，需要重新登录");
                            reLogin(
                                function(){
                                    dlg.log("重新登录成功。");
                                    startAnalyseUser(userid, contentType);
                                }
                            );
                        }else
                        {
                            dlg.log("错误信息：" + (jore.error.message || jore.error.user_message));
                            dlg.textdown.disabled = false; //错误暂停时，可以操作目前的进度。
                            dlg.startdown.disabled = false;
                        }
                        return;
                    },
                    function(re) { //onload_notjson_Cb //返回不是JSON
                        dlg.log("错误：返回不是JSON，或程序异常");
                        works.runing = false;
                        dlg.textdown.disabled = false; //错误暂停时，可以操作目前的进度。
                        dlg.startdown.disabled = false;
                    },
                    function(re) { //onerror_Cb //AJAX发送失败
                        dlg.log("错误：AJAX发送失败");
                        works.runing = false;
                        dlg.textdown.disabled = false; //错误暂停时，可以操作目前的进度。
                        dlg.startdown.disabled = false;
                    }
                );
            }

            //开始分析作品的前置操作
            function startAnalyseWorks(user, contentType) {
                var uInfo = user.info;
                var works, total, contentName, apiurl;
                //获取作品,contentType == 0，获取收藏,contentType == 1
                if (contentType == 0) {
                    works = user.illusts;
                    total = uInfo.profile.total_illusts + uInfo.profile.total_manga;
                    contentName = "作品";
                    apiurl = "https://app-api.pixiv.net/v1/user/illusts?user_id=" + uInfo.user.id;
                } else {
                    works = user.bookmarks;
                    total = uInfo.profile.total_illust_bookmarks_public;
                    contentName = "收藏";
                    apiurl = "https://app-api.pixiv.net/v1/user/bookmarks/illust?user_id=" + uInfo.user.id + "&restrict=public";
                }
                if (works.item.length > 0) { //断点续传
                    dlg.log(contentName + " 断点续传进度 " + works.item.length + "/" + total);
                    dlg.progress.set(works.item.length / total); //设置当前下载进度
                    apiurl = works.next_url;
                }
                analyseWorks(user, contentType, apiurl); //开始获取第一页
            }
            //分析作品递归函数
            function analyseWorks(user, contentType, apiurl) {
                var uInfo = user.info;
                var works, total, contentName;
                if (contentType == 0) {
                    works = user.illusts;
                    total = uInfo.profile.total_illusts + uInfo.profile.total_manga;
                    contentName = "作品";
                } else {
                    works = user.bookmarks;
                    total = uInfo.profile.total_illust_bookmarks_public;
                    contentName = "收藏";
                }
                if (works.done) {
                    //返回所有动图
                    var ugoiras = works.item.filter(function(item) {
                        return item.type == "ugoira";
                    })
                    dlg.log("共存在 " + ugoiras.length + " 件动图");
                    if (ugoiras.some(function(item) { //如果有没有帧数据的动图
                            return item.ugoira_metadata == undefined;
                        })) {
                        if (!getValueDefault("pubd-getugoiraframe",true)) {
                            dlg.log("由于用户设置，跳过获取动图帧数。");
                        } else {
                            analyseUgoira(works, ugoiras, function() { //开始分析动图
                                analyseWorks(user, contentType, apiurl) //开始获取下一页
                            });
                            return;
                        }
                    }//没有动图则继续
                    
                    if (works.item.length < total)
                        dlg.log("可能因为权限原因，无法获取到所有 " + contentName);

                    //计算一下总页数
                    works.picCount = works.item.reduce(function(pV,cItem){
                        var page = cItem.page_count;
                        if (cItem.type == "ugoira" && cItem.ugoira_metadata) //动图
                        {
                            page = cItem.ugoira_metadata.frames.length;
                        }
                        return pV+=page;
                    },0);

                    dlg.log(contentName + " 共 " + works.item.length + " 件（约 " + works.picCount + " 张图片）已获取完毕。");
                    dlg.progress.set(1);
                    works.runing = false;
                    works.next_url = "";
                    dlg.textdown.disabled = false;
                    dlg.startdown.disabled = false;
                    if (getValueDefault("pubd-autodownload",false)) { //自动开始
                        dlg.log("🅰️自动开始发送");
                        dlg.startdownload();
                    }
                    return;
                }
                if (works.break) {
                    dlg.log("检测到 " + contentName + " 中断进程命令");
                    works.break = false;
                    works.runing = false;
                    dlg.textdown.disabled = false; //启用按钮，中断暂停时，可以操作目前的进度。
                    dlg.startdown.disabled = false;
                    return;
                }

                xhrGenneral(
                    apiurl,
                    function(jore) { //onload_suceess_Cb
                        works.runing = true;
                        var illusts = jore.illusts;
                        for (var ii = 0, ii_len = illusts.length; ii < ii_len; ii++) {
                            var work = illusts[ii];
                            var original;
                            if (work.page_count > 1) { /*漫画多图*/
                                original = work.meta_pages[0].image_urls.original;
                            } else { /*单张图片或动图，含漫画单图*/
                                original = work.meta_single_page.original_image_url;
                            }
                            var regSrc = new RegExp(illustPattern, "ig");
                            var regRes = regSrc.exec(original);
                            if (regRes) {
                                //然后添加扩展名等
                                work.url_without_page = regRes[1];
                                work.domain = regRes[2];
                                work.filename = regRes[3];
                                work.token = regRes[4];
                                work.extention = regRes[5];
                            } else {
                                var regSrcL = new RegExp(limitingPattern, "ig");
                                var regResL = regSrcL.exec(original);
                                if (regResL) {
                                    dlg.log(contentName + " " + work.id + " 非公开，无权获取下载地址。");
                                    //console.log(work);
                                    work.url_without_page = regResL[1];
                                    work.domain = regResL[2];
                                    work.filename = regResL[3];
                                    work.token = regResL[4];
                                    work.extention = regResL[5];
                                } else {
                                    dlg.log(contentName + " " + work.id + " 原图格式未知。");
                                }
                            }

                            works.item.push(work);
                        }
                        dlg.log(contentName + " 获取进度 " + works.item.length + "/" + total);
                        if (works == dlg.works) dlg.progress.set(works.item.length / total); //如果没有中断则设置当前下载进度
                        if (jore.next_url) { //还有下一页
                            works.next_url = jore.next_url;
                        } else { //没有下一页
                            works.done = true;
                        }
                        analyseWorks(user, contentType, jore.next_url); //开始获取下一页
                    },
                    function(jore) { //onload_haserror_Cb //返回错误消息
                        works.runing = false;
                        //下面开始自动登陆
                        if (jore.error.message.indexOf("Error occurred at the OAuth process.") >= 0) {
                            dlg.log("Token过期或错误，需要重新登录");
                            reLogin(
                                function(){
                                    dlg.log("重新登录成功。");
                                    analyseWorks(user, contentType, apiurl);
                                }
                            );
                        }else
                        {
                            dlg.log("错误信息：" + (jore.error.message || jore.error.user_message));
                            dlg.textdown.disabled = false; //错误暂停时，可以操作目前的进度。
                            dlg.startdown.disabled = false;
                        }
                        return;
                    },
                    function(re) { //onload_notjson_Cb //返回不是JSON
                        dlg.log("错误：返回不是JSON，或程序异常");
                        works.runing = false;
                        dlg.textdown.disabled = false; //错误暂停时，可以操作目前的进度。
                        dlg.startdown.disabled = false;
                    },
                    function(re) { //onerror_Cb //AJAX发送失败
                        dlg.log("错误：AJAX发送失败");
                        works.runing = false;
                        dlg.textdown.disabled = false; //错误暂停时，可以操作目前的进度。
                        dlg.startdown.disabled = false;
                    }
                )
            }

            function analyseUgoira(works, ugoirasItems, callback) {
                var dealItems = ugoirasItems.filter(function(item) {
                    return (item.type == "ugoira" && item.ugoira_metadata == undefined);
                })
                if (dealItems.length < 1) {
                    dlg.log("动图获取完毕");
                    dlg.progress.set(1); //设置当前下载进度
                    callback();
                    return;
                }
                if (works.break) {
                    dlg.log("检测到中断进程命令");
                    works.break = false;
                    works.runing = false;
                    dlg.textdown.disabled = false; //中断暂停时，可以操作目前的进度。
                    dlg.startdown.disabled = false;
                    return;
                }

                var work = dealItems[0]; //当前处理的图

                xhrGenneral(
                    "https://app-api.pixiv.net/v1/ugoira/metadata?illust_id=" + work.id,
                    function(jore) { //onload_suceess_Cb
                        works.runing = true;
                        //var illusts = jore.illusts;
                        work = Object.assign(work, jore);
                        dlg.log("动图信息 获取进度 " + (ugoirasItems.length - dealItems.length + 1) + "/" + ugoirasItems.length);
                        dlg.progress.set(1 - dealItems.length / ugoirasItems.length); //设置当前下载进度
                        analyseUgoira(works, ugoirasItems, callback); //开始获取下一项
                    },
                    function(jore) { //onload_haserror_Cb //返回错误消息
                        works.runing = false;
                        //下面开始自动登陆
                        if (jore.error.message.indexOf("Error occurred at the OAuth process.") >= 0) {
                            dlg.log("Token过期或错误，需要重新登录");
                            reLogin(
                                function(){
                                    dlg.log("重新登录成功。");
                                    analyseUgoira(works, ugoirasItems, callback);
                                }
                            );
                        }else if(work.restrict > 0) //非公共权限
                        { //添加一条空信息
                            work.ugoira_metadata = {
                                frames: [],
                                zip_urls: {
                                    medium: "",
                                },
                            };
                            dlg.log("无访问权限，跳过本条。");
                            analyseUgoira(works, ugoirasItems, callback); //开始获取下一项
                        }else
                        {
                            dlg.log("错误信息：" + (jore.error.message || jore.error.user_message));
                            dlg.textdown.disabled = false; //错误暂停时，可以操作目前的进度。
                            dlg.startdown.disabled = false;
                        }
                        return;
                    },
                    function(re) { //onload_notjson_Cb //返回不是JSON
                        dlg.log("错误：返回不是JSON，或程序异常");
                        works.runing = false;
                        dlg.textdown.disabled = false; //错误暂停时，可以操作目前的进度。
                        dlg.startdown.disabled = false;
                    },
                    function(re) { //onerror_Cb //AJAX发送失败
                        dlg.log("错误：AJAX发送失败");
                        works.runing = false;
                        dlg.textdown.disabled = false; //错误暂停时，可以操作目前的进度。
                        dlg.startdown.disabled = false;
                    }
                )
            }
        }
    //输出文本按钮
    dlg.textdownload = function() {
            if (dlg.downScheme.selectedOptions.length < 1) { alert("没有选中方案"); return; }
            var scheme = dlg.schemes[dlg.downScheme.selectedIndex];
            var contentType = dlg.dcType[1].checked ? 1 : 0;
            var userInfo = dlg.user.info;
            var illustsItems = contentType == 0 ? dlg.user.illusts.item : dlg.user.bookmarks.item; //将需要分析的数据储存到works里
            dlg.log("正在生成文本信息");

            try {
                var outTxtArr = illustsItems.map(function(item) {
                    var page_count = item.page_count;
                    if (item.type == "ugoira" && item.ugoira_metadata) //动图
                    {
                        page_count = item.ugoira_metadata.frames.length;
                    }
                    var outArr = []; //输出内容
                    for (var pi = 0; pi < page_count; pi++) {
                        if (item.filename != "limit_mypixiv")
                            outArr.push(showMask(scheme.textout, scheme.masklist, userInfo, item, pi));
                    }
                    return outArr.join("");
                });
                var outTxt = outTxtArr.join("");
                dlg.textoutTextarea.value = outTxt;
                dlg.textoutTextarea.classList.remove("display-none");
                dlg.log("文本信息输出成功");
            } catch (error) {
                console.log(error)
            }
        }
    //开始下载按钮
    dlg.startdownload = function() {
            dlg.textoutTextarea.classList.add("display-none");
            if (dlg.downScheme.selectedOptions.length < 1) { alert("没有选中方案"); return; }
            var scheme = dlg.schemes[dlg.downScheme.selectedIndex];
            var contentType = dlg.dcType[1].checked ? 1 : 0;
            var userInfo = dlg.user.info;
            var works = (contentType == 0 ? dlg.user.illusts : dlg.user.bookmarks);
            var illustsItems = works.item.concat(); //为了不改变原数组，新建一个数组

            var termwiseType = parseInt(getValueDefault("pubd-termwiseType", 0));
            if (termwiseType == 0)
                dlg.log("开始按图片逐项发送（约 "+works.picCount+" 次请求），⏳请耐心等待。");
            else if (termwiseType == 1)
                dlg.log("开始按作品逐项发送（约 "+illustsItems.length+" 次请求），⏳请耐心等待。");
            else if (termwiseType == 2)
                dlg.log("开始按作者发送，数据量较大时⏱️有较高延迟。\n-- ⏳请耐心等待，勿多次点击。");
            else
            {
                alert("错误：未知的逐项模式" + termwiseType);
                console.error("PUBD：错误：未知的逐项模式：", termwiseType);
                return;
            }
            var downP = { progress: dlg.progress, current: 0, max: 0 };
            downP.max = works.picCount; //获取总需要下载发送的页数
    
            var aria2 = new Aria2(scheme.rpcurl); //生成一个aria2对象
            sendToAria2_illust(aria2, termwiseType, illustsItems, userInfo, scheme, downP, function() {
                aria2 = null;
                dlg.log(userInfo.user.name + " 下载信息发送完毕😄");
                
                var ntype = parseInt(getValueDefault("pubd-noticeType", 0)); //获取结束后如何处理通知
                var bodyText = "" + userInfo.user.name + " 的相关插画已全部发送到指定的Aria2";
                if (ntype == 1)
                    bodyText += "\n\n点击此通知🔙返回页面。";
                else if (ntype == 2)
                    bodyText += "\n\n点击此通知❌关闭页面。";
                else if (ntype == 3)
                    bodyText += "\n\n通知结束时页面将🅰️❌自动关闭。";
                GM_notification(
                    {
                        text:bodyText,
                        title:"下载信息发送完毕",
                        image:userInfo.user.profile_image_urls.medium
                    },
                    function(){ //点击了通知
                        var ntype = parseInt(getValueDefault("pubd-noticeType", 0));
                        if (ntype == 1)
                            window.focus();
                        else if (ntype == 2)
                            window.close();
                    },
                    function(){ //关闭了通知
                        var ntype = parseInt(getValueDefault("pubd-noticeType", 0));
                        if (ntype == 3)
                            window.close();
                    },
                );
            });
        }
        //启动初始化
    dlg.initialise = function() {
        var dcType = 0;
        if (dlg.user.bookmarks.runing) //如果有程序正在运行，则覆盖设置。
            dcType = 1;
        else if (dlg.user.illusts.runing)
            dcType = 0;

        dlg.dcType[dcType].checked = true;
        if (getValueDefault("pubd-autoanalyse",false)) {
            if (!dlg.uinfo.userid) {
                dlg.uinfo.userid = parseInt(prompt("没有用户ID，请手动输入。", "ID错误"));
            }    
            dlg.analyse(dcType, dlg.uinfo.userid);
        }

        //pubd.downSchemes = NewDownSchemeArrayFromJson(getValueDefault("pubd-downschemes",0)); //重新读取下载方案（可能被其他页面修改的）
        dlg.reloadSchemes();
    };

    return dlg;
}
//为了区分设置窗口和保存的设置，产生一个新的下载方案数组
function NewDownSchemeArrayFromJson(jsonarr) {

    if (typeof(jsonarr) == "string") {
        try {
            var jsonarr = JSON.parse(jsonarr);
        } catch (e) {
            console.error("PUBD：拷贝新下载方案数组时失败", e);
            return false;
        }
    }
    var sarr = new Array();
    if (jsonarr instanceof Array) {
        for (var si = 0; si < jsonarr.length; si++) {
            var scheme = new DownScheme();
            scheme.loadFromJson(jsonarr[si]);
            sarr.push(scheme);
        }
    }
    return sarr;
}
//作品循环递归输出
function sendToAria2_illust(aria2, termwiseType, illusts, userInfo, scheme, downP, callback) {
    if (illusts.length < 1) //做完了
    {
        callback();
        return;
    }
    if (pubd.downbreak)
    {
        GM_notification({text:"已中断向Aria2发送下载信息。但Aria2本身仍未停止下载已添加内容，请手动停止。", title:scriptName, image:scriptIcon});
        pubd.downbreak = false;
        return;
    }

    if (termwiseType == 0) //完全逐项
    {
        var illust = illusts.shift(); //读取首个作品
        sendToAria2_Page(aria2, illust, 0, userInfo, scheme, downP, function() {
            sendToAria2_illust(aria2, termwiseType, illusts, userInfo, scheme, downP, callback); //发送下一个作品
        })
        return; //不再继续执行
    }else if (termwiseType == 1) //部分逐项（每作品合并）
    {
        var illust = illusts.shift(); //读取首个作品
        var page_count = illust.page_count; //作品页数
        if (illust.type == "ugoira" && illust.ugoira_metadata) //修改动图的页数
        {
            page_count = illust.ugoira_metadata.frames.length;
        }
    
        if (illust.filename == "limit_mypixiv") //无法查看的文件
        {
            downP.progress.set((downP.current += page_count) / downP.max); //直接加上所有页数
            sendToAria2_illust(aria2, termwiseType, illusts, userInfo, scheme, downP, callback); //调用自身
            return;
        }
        var aria2_params = [];
        for (page=0;page<page_count;page++)
        {
            if (returnLogicValue(scheme.downfilter, userInfo, illust, page)) {
                //跳过此次下载
                downP.progress.set(++downP.current / downP.max); //设置进度
                sendToAria2_Page(illust, ++page, userInfo, scheme, downP, callback); //递归调用自身
                console.info("符合下载过滤器定义，跳过下载：", illust);
            } else {
                var aria2_method = {'methodName':'aria2.addUri','params':[]}
                var url = (scheme.https2http //https替换成http
                            ? illust.url_without_page.replace(/^https:\/\//igm, "http://")
                            : illust.url_without_page)
                    + page + "." + illust.extention;
                    aria2_method.params.push([url]); //添加下载链接
                var options = {
                    "out": replacePathSafe(showMask(scheme.savepath, scheme.masklist, userInfo, illust, page), 1),
                    "referer": "https://app-api.pixiv.net/",
                    "user-agent": UA,
                }
                if (scheme.savedir.length > 0) {
                    options.dir = replacePathSafe(showMask(scheme.savedir, scheme.masklist, userInfo, illust, page), 0);
                }
                aria2_method.params.push(options);
                aria2_params.push(aria2_method);
            }
        }
        aria2.system.multicall([aria2_params],function(res){
            if (res === false) {
                alert("发送到指定的Aria2失败，请检查到Aria2连接是否正常。");
                return;
            }
            downP.progress.set((downP.current += page_count) / downP.max); //直接加上所有页数
            sendToAria2_illust(aria2, termwiseType, illusts, userInfo, scheme, downP, callback); //调用自身
        });
        return;
    }else if(termwiseType == 2) //不逐项，每作者合并
    {
        var aria2_params = [];
        for (var illustIndex = 0; illustIndex < illusts.length; illustIndex++)
        {
            var illust = illusts[illustIndex];
            var page_count = illust.page_count; //作品页数
            if (illust.type == "ugoira" && illust.ugoira_metadata) //修改动图的页数
            {
                page_count = illust.ugoira_metadata.frames.length;
            }
            for (page=0;page<page_count;page++)
            {
                if (returnLogicValue(scheme.downfilter, userInfo, illust, page)) {
                    //跳过此次下载
                    console.info("符合下载过滤器定义，跳过下载：", illust);
                } else {
                    var aria2_method = {'methodName':'aria2.addUri','params':[]}
                    var url = (scheme.https2http //https替换成http
                                ? illust.url_without_page.replace(/^https:\/\//igm, "http://")
                                : illust.url_without_page)
                        + page + "." + illust.extention;
                        aria2_method.params.push([url]); //添加下载链接
                    var options = {
                        "out": replacePathSafe(showMask(scheme.savepath, scheme.masklist, userInfo, illust, page), 1),
                        "referer": "https://app-api.pixiv.net/",
                        "user-agent": UA,
                    }
                    if (scheme.savedir.length > 0) {
                        options.dir = replacePathSafe(showMask(scheme.savedir, scheme.masklist, userInfo, illust, page), 0);
                    }
                    aria2_method.params.push(options);
                    aria2_params.push(aria2_method);
                }
            }
        }
        aria2.system.multicall([aria2_params],function(res){
            if (res === false) {
                alert("发送到指定的Aria2失败，请检查到Aria2连接是否正常。");
                return;
            }
            downP.progress.set((downP.current = downP.max) / downP.max); //直接加上所有页数
            sendToAria2_illust(aria2, termwiseType, [], userInfo, scheme, downP, callback); //调用自身
        });
        return;
    }
}
//作品每页循环递归输出
function sendToAria2_Page(aria2, illust, page, userInfo, scheme, downP, callback) {
    if (pubd.downbreak) {
        GM_notification({text:"已中断向Aria2发送下载信息。但Aria2本身仍未停止下载已添加内容，请手动停止。", title:scriptName, image:scriptIcon});
        pubd.downbreak = false;
        return;
    }
    var page_count = illust.page_count;
    if (illust.type == "ugoira" && illust.ugoira_metadata) //动图
    {
        page_count = illust.ugoira_metadata.frames.length;
    }
    if (page >= page_count || illust.filename == "limit_mypixiv") //无法查看的文件
    {
        if (illust.filename == "limit_mypixiv")
            downP.progress.set((downP.current += page_count) / downP.max); //直接加上所有页数
        callback();
        return;
    }
    var url = (scheme.https2http ? illust.url_without_page.replace(/^https:\/\//igm, "http://") : illust.url_without_page) //https替换成http
        +
        page + "." + illust.extention;

    //console.log(scheme.downfilter, returnLogicValue(scheme.downfilter, userInfo, illust, page));
    if (returnLogicValue(scheme.downfilter, userInfo, illust, page)) {
        //跳过此次下载
        downP.progress.set(++downP.current / downP.max); //设置进度
        sendToAria2_Page(illust, ++page, userInfo, scheme, downP, callback); //递归调用自身
        console.info("符合下载过滤器定义，跳过下载：", illust);
    } else {
        var options = {
            "out": replacePathSafe(showMask(scheme.savepath, scheme.masklist, userInfo, illust, page), 1),
            "referer": "https://app-api.pixiv.net/",
            "user-agent": UA,
        }
        if (scheme.savedir.length > 0) {
            options.dir = replacePathSafe(showMask(scheme.savedir, scheme.masklist, userInfo, illust, page), 0);
        }
        aria2.addUri(url, options, function(res) {
            if (res === false) {
                alert("发送到指定的Aria2失败，请检查到Aria2连接是否正常。");
                return;
            }
            downP.progress.set(++downP.current / downP.max); //设置进度
            sendToAria2_Page(illust, ++page, userInfo, scheme, downP, callback); //递归调用自身
        });
    }
}
//返回掩码值
function showMask(oldStr, maskList, user, illust, page) {
    var newStr = oldStr;
    //var pattern = "%{([^}]+)}"; //旧的，简单匹配
    var regPattern = "%{(.*?(?:[^\\\\](?:\\\\{2})+|[^\\\\]))}"; //新的，支持转义符
    var regResult = null;

    //不断循环直到没有掩码
    while ((regResult = new RegExp(regPattern).exec(newStr)) != null) {
        var mskO = regResult[0], //包含括号的原始掩码
            mskN = regResult[1]; //去掉掩码括号
        if (mskN != undefined) {
            //去掉转义符的掩码名
            mskN = (mskN != undefined) ? mskN.replace(/\\{/ig, "{").replace(/\\}/ig, "}").replace(/\\\\/ig, "\\") : null;
            //搜寻自定义掩码
            var cusMasks = maskList.filter(function(mask) { return mask.name == mskN; });
            if (cusMasks.length > 0) { //如果有对应的自定义掩码
                var cusMask = cusMasks[0];
                try {
                    if (returnLogicValue(cusMask.logic, user, illust, page)) //mask的逻辑判断
                        newStr = newStr.replace(mskO, cusMask.content);
                    else
                        newStr = newStr.replace(mskO, "");
                } catch (e) {
                    console.error(mskO + " 自定义掩码出现了异常情况", e);
                }
            } else { //普通掩码
                try {
                    var evTemp = eval(mskN);
                    if (evTemp != undefined)
                        newStr = newStr.replace(mskO, evTemp.toString());
                    else
                        newStr = newStr.replace(mskO, "");
                } catch (e) {
                    newStr = newStr.replace(mskO, "");
                    console.error(mskO + " 掩码出现了异常情况", e);
                }
            }
        }
    }

    return newStr;
}
//返回逻辑值
function returnLogicValue(logic, user, illust, page) {
    try {
        if (logic.length == 0) return false;
        var evTemp = eval("(" + logic + ")");
        return evTemp;
    } catch (e) {
        console.error("下载过滤器出现了异常情况，逻辑内容：","(" + logic + ")", e);
        return false;
    }
}

function replacePathSafe(str, type) //去除Windows下无法作为文件名的字符，目前为了支持Linux暂不替换两种斜杠吧。
{ //keepTree表示是否要保留目录树的字符（\、/和:）
    if (typeof(str) == "undefined")
    {
        return "";
    }
    var nstr = str; //新字符
    nstr = nstr.toString();
    nstr = nstr.replace(/\u0000-\u001F\u007F-\u00A0/ig, ""); //替换所有的控制字符
    var patternStrs = [
        "[\\*\\?\"<>\\|]",                 //只替换路径中完全不能出现的特殊字符
        "[\\*\\?\"<>\\|\\r\\n]",           //上述字符加冒号:，用于非驱动器路径
        "[\\*\\?\"<>\\|\\r\\n\\\\\\/]",    //完全替换所有不能出现的特殊字符，包含斜杠
    ];
    if (patternStrs[type] != undefined)
    {
        nstr = nstr.replace(new RegExp(patternStrs[type],"ig"), "_"); //只替换路径中完全不能出现的特殊字符
    }
    return nstr;
}

//开始构建UI
function findInsertPlace(touch, loggedIn) {
    if (touch ||  //手机版
        self.frameElement && self.frameElement.tagName == "IFRAME" ||    //属于内嵌iframe
        window.frames.length != parent.frames.length ||
        self != top
    )
    {
        //alert("PUBD暂不支持手机版");
        clearInterval(findInsertPlaceHook);
        return;
    } else {
        var btnStartInsertPlace = document.querySelector("#root>div>div>div>div>div:nth-of-type(3)") //2018年10月8日 新版用户资料首页
                                ||document.querySelector("#root>div>div>div>aside>section") //新版作品页
                                ||document.querySelector("._user-profile-card") //老版用户资料页
                                ||document.querySelector(".ui-layout-west aside") //老版作品页
                                ||document.querySelector(".introduction") //未登录页面
                                ;
        if (btnStartInsertPlace == undefined)
        {
            console.error("PUBD：未找到开始按钮插入点。");
            return;
        }else
        {
            clearInterval(findInsertPlaceHook);
        }

        //生成警告
        var showAlert = btnStartInsertPlace.appendChild(document.createElement("h1"));
        showAlert.className = "pubd-alert-" + pubd.cssVersion;
        showAlert.innerHTML = '你没有正确安装用户样式，或用户样式已过期，或用户样式没过期但脚本过期，请访问<a href="https://github.com/Mapaler/PixivUserBatchDownload" target="_blank">PUBD发布页</a>更新版本。';
        //操作按钮
        var btnStartBox = btnStartInsertPlace.appendChild(document.createElement("div"));
        btnStartBox.className = "pubd-btnStartInsertPlace";
        pubd.start = btnStartBox.appendChild(buildbtnStart(touch));
        pubd.menu = btnStartBox.appendChild(buildbtnMenu(touch));
    }
}
//开始主程序
function start(touch) {
    //载入设置
    pubd.auth = new Auth();
    try {
        pubd.auth.loadFromResponse(JSON.parse(GM_getValue("pubd-auth")));
    } catch (e) {
        console.error("PUBD：脚本初始化时，读取登录信息失败。", e);
    }
    pubd.downSchemes = NewDownSchemeArrayFromJson(getValueDefault("pubd-downschemes",0));

    //对下载方案的修改添加监听
    GM_addValueChangeListener("pubd-downschemes", function(name, old_value, new_value, remote) {
        pubd.downSchemes = NewDownSchemeArrayFromJson(new_value); //重新读取下载方案（可能被其他页面修改的）
    })

    //添加所有视窗
    var btnDlgInsertPlace = document.body;
    pubd.dialog.config = btnDlgInsertPlace.appendChild(buildDlgConfig(touch));
    pubd.dialog.login = btnDlgInsertPlace.appendChild(buildDlgLogin(touch));
    pubd.dialog.downthis = btnDlgInsertPlace.appendChild(buildDlgDownThis(touch));

    GM_registerMenuCommand("PUBD-下载该画师", function(){pubd.dialog.downthis.show();});
    GM_registerMenuCommand("PUBD-选项", function(){pubd.dialog.config.show();});
    //循环寻找插入点
    findInsertPlaceHook = setInterval(function(){
        findInsertPlace(touch, pubd.loggedIn);
    }, 1000);
}
start(pubd.touch); //开始主程序