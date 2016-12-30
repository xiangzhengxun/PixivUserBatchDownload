# PixivUserBatchDownload v5.0开发中
[P站](http://www.pixiv.net/member.php?id=3896348)画师个人作品批量下载工具。

##软件需求
1. 用户脚本扩展，用于实现脚本的功能。
 * [![](https://www.mozilla.org/media/img/firefox/favicon.dc6635050bf5.ico)FireFox](http://www.firefox.com)安装[![](https://github.com/greasemonkey/greasemonkey/raw/master/skin/icon32.png)GreaseMonkey](http://www.greasespot.net/)扩展。
 * ![](http://www.chromium.org/_/rsrc/1438879449147/config/customLogo.gif)Chromium系安装[![](https://addons.cdn.mozilla.net/user-media/addon_icons/683/683490-64.png?modified=1463757971)Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=zh-CN)扩展。
2. 用户样式扩展，用于调整脚本的外观。
 * 安装[![](https://addons.cdn.mozilla.net/user-media/addon_icons/2/2108-64.png?modified=1453837884)Stylish](https://userstyles.org/)扩展（两浏览器都有）。
3. 下载软件，接受脚本添加的下载信息。
 * [Aria2](https://aria2.github.io/) ，推荐使用PRC(Remote Procedure Call Protocol)模式启动。
 * 管理下载
  1. [![](https://github.com/ziahamza/webui-aria2/raw/master/favicon.ico)webui-aria2](https://github.com/ziahamza/webui-aria2)，建议时不时看看有没有更新，webui-aria2经常会增加中文翻译。
  2. [YAAW](https://github.com/binux/yaaw)，作者是中国人，但更新较少。

## License|许可协议
用到了一部分[ThunderLixianExporter](https://github.com/binux/ThunderLixianExporter)的代码，与YAAW是同一开发者。

PixivUserBatchDownload Copyright(C) 2016 by Mapaler

此程序是免费软件。你可以将它根据“GNU通用公共许可证第三版(GPLv3)”重新分发和/或修改。[LICENSE](https://github.com/Mapaler/PixivUserBatchDownload/blob/master/LICENSE)

如果你想分发你修改后的程序，但是你不想要公布修改后的源代码，请与我联系。

## 配置Aria2
[下载最新的Aria2](https://github.com/tatsuhiro-t/aria2/releases)，比如我下载的是64位Windows版“aria2-1.25.0-win-64bit-build1.zip”，然后解压到文件夹。

1. 在aria2c路径下新建文本文件“RPC模式启动aria2_P站下载服务端”，内容如下，并将扩展名更改为bat。[直接下载](https://github.com/Mapaler/PixivUserBatchDownload/raw/develop/First_File/aria2_RPC_mode_for_Pixiv.bat)
	
	```bat
	if not exist aria2_Pixiv.session.txt cd .>aria2_Pixiv.session.txt
	aria2c.exe --conf-path="aria2_Pixiv.ini"
	```

2. 然后继续建立“aria2_Pixiv.ini”，内容如下。虽然也可以把这些参数写在命令行，但是写在设置文件里更清楚。[直接下载](https://github.com/Mapaler/PixivUserBatchDownload/raw/develop/First_File/aria2_Pixiv.ini)
	
	```ini
	# Aria2默认保存路径可自行修改，v1.4.0开始此设置已内置到下载设置，留空时才使用这里的设置。
	dir=C:\Users\Public\Downloads\
	# 禁用覆盖（跳过已下载的）
	allow-overwrite=false
	# 禁用重命名（跳过已下载的）
	auto-file-renaming=false
	# 修改为服务器时间
	remote-time=true
	# 断点续传
	continue=true

	# 保存会话内容到文件
	save-session=aria2_Pixiv.session.txt
	# 每60秒保存当前会话，关闭时也会保存，设置为0只有关闭时才保存
	save-session-interval=60
	# 启动时读取会话内容
	input-file=aria2_Pixiv.session.txt

	# 开启RPC相关选项
	enable-rpc=true
	rpc-allow-origin-all=true
	rpc-listen-all=true
	rpc-save-upload-metadata=true
	rpc-secure=false
	```
	设置中若含中文/日文字符需要保存为UTF-8编码。

然后运行bat文件即可开启Aria2的RPC模式。

![文件示例](http://ww4.sinaimg.cn/large/6c84b2d6gw1f30n8ywl7bj20mp0fpaff.jpg)

[下载最新的webui-aria2（有中文）](https://github.com/ziahamza/webui-aria2/archive/master.zip)，然后解压到文件夹，打开“index.html”，默认设置下会自动连接上刚才配置的本地的Aria2 RPC模式。然后你便可以像普通下载软件一样对Aria2进行管理了。

![webui-aria2界面](http://ww2.sinaimg.cn/large/6c84b2d6gw1f1o5q4ljyqj20vv0nvgq4.jpg)

## 开始下载
开发中。

## 设置
开发中。

##支持Aria2搭建NAS远程下载
Aria2是跨平台下载软件，你可以在其他系统下配置本程序。我现在都是从单位下载到家里的安了Aria2的OpenWrt路由器上。

没有OpenWrt的路由器却有安卓盒子可以考虑在安卓上运行，请参考[不需root用aria2搭建NAS方法](http://cn.club.vmall.com/thread-3861317-1-1.html)

在我的华为盒子M330上配置了Aria2，然后打开路由的端口映射（还可以上个动态DNS），在单位办公室成功访问。能否访问取决于你的网络拓扑情况，移动/铁通的网络是半个局域网，电信联通可能访问不了，但是可以用移动的数据流量访问。

注意Linux（含安卓）系保存路径一定得改用左斜杠，不然无法正确生成路径。

![脚本的设置](http://ww3.sinaimg.cn/large/6c84b2d6jw1f2eano3hd7j20al0bign5.jpg)

因为开公网访问需要设置加密，在Aria2配置文件中加入如下。更多Aria2选项请访问 https://aria2.github.io/manual/en/html/aria2c.html#options
```ini
# token验证
rpc-secret=访问密码
```
脚本设置中的RPC路径为
`http://token:访问密码@域名或IP:端口/jsonrpc`

webui-aria2则这样设置

![网页端的设置](http://ww4.sinaimg.cn/large/6c84b2d6jw1f2eao7814vj20sa0jbadz.jpg)

成功的下载到安卓电视盒子里，可以在家里用ES文件管理器的“远程管理”访问盒子里的文件（我下载到扩展SD卡的）。

![电视盒子上运行的Aria2](http://ww3.sinaimg.cn/large/6c84b2d6gw1f2eajkd4l6j21be0qotkh.jpg)

今天在办公室电视机顶盒上成功连上家里的安卓电视盒子并下载。

![办公室的电脑连上家里的电视盒子](http://ww3.sinaimg.cn/large/6c84b2d6gw1f2f00lxifoj20vl0hs0ue.jpg)