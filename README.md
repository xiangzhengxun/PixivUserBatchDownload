# PixivUserBatchDownload
[P站](http://www.pixiv.net/member.php?id=3896348)画师个人作品批量下载工具，本程序仅支持P站电脑版登录后的网页。

建议使用[火狐](http://www.firefox.com)的[GreaseMonkey](http://www.greasespot.net/)扩展[安装本脚本程序](https://greasyfork.org/scripts/17879)（←到Greasy Fork安装可以自动更新的哦），因为Chrome技术原因仅提供有限功能支持，Chrome虽然原生支持但还是建议装Tampermonkey扩展。

需要配和[Aria2](https://aria2.github.io/)下载软件使用，推荐使用PRC模式并用[webui-aria2](https://github.com/ziahamza/webui-aria2)管理下载（不推荐[YAAW](https://github.com/binux/yaaw)，因为作者忙着工(tiao)作(cao)早就没更新了）。

## License|许可协议
用到了一部分[ThunderLixianExporter](https://github.com/binux/ThunderLixianExporter)的代码

PixivUserBatchDownload Copyright(C) 2016 by Mapaler

此程序是免费软件。你可以将它根据GNU通用公共许可证第三版重新分发和/或修改。[LICENSE](https://github.com/Mapaler/PixivUserBatchDownload/blob/master/LICENSE)

如果你想分发你修改后的程序，但是你不想要公布修改后的源代码，请与我联系。

## 配置Aria2
[下载最新的Aria2](https://github.com/tatsuhiro-t/aria2/releases)，比如我下载的是64位Windows版“aria2-1.21.0-win-64bit-build1.zip”，然后解压到文件夹。

1. 在aria2c路径下新建文本文件“RPC模式启动aria2_P站下载服务端”，内容如下，并将扩展名更改为bat。

	`aria2c.exe --conf-path="aria2_Pixiv.ini"`

2. 然后继续建立“aria2_Pixiv.ini”，内容如下。虽然也可以把这些参数写在命令行，但是写在设置文件里更清楚。
	```ini
	# Aria2默认保存路径可自行修改，v1.4.0开始此设置已内置到下载设置，留空时才使用这里的设置。
	dir=C:\Users\Public\Downloads\
	# 禁用覆盖（跳过已下载的）
	allow-overwrite=false
	# 禁用重命名（跳过已下载的）
	auto-file-renaming=false
	# 修改为服务器时间
	remote-time=true

	# 保存会话内容到文件
	save-session=aria2_Pixiv.session.txt
	# 每30秒保存当前会话，关闭时也会保存，设置为0只有关闭时才保存
	save-session-interval=30
	# 启动时读取会话内容
	input-file=aria2_Pixiv.session.txt

	# 开启RPC相关选项
	enable-rpc=true
	rpc-allow-origin-all=true
	rpc-listen-all=true
	rpc-save-upload-metadata=true
	rpc-secure=false
	```
	选项中若含中文/日文字符需要保存为UTF-8编码，下图分别是Windows自带记事本与Notepad2的保存方法。
	![Windows自带记事本保存为UTF-8编码](http://ww3.sinaimg.cn/large/6c84b2d6gw1f2dwz1csn0j20kw0dxtah.jpg)![Notepad2保存为UTF-8编码](http://ww2.sinaimg.cn/large/6c84b2d6gw1f2dwshr79mj20fw0ejdho.jpg)
3. 再建立“aria2_Pixiv.session.txt”的空文件。此文件用来保存下载会话，可以使关闭Aria2程序后，再次打开继续下载之前没下载完成的。

![文件示例](http://ww2.sinaimg.cn/large/6c84b2d6gw1f2dwm3rlooj20j20nr42z.jpg)

然后运行bat文件即可开启Aria2的RPC模式。

[下载最新的webui-aria2（有中文）](https://github.com/ziahamza/webui-aria2/archive/master.zip)，然后解压到文件夹，打开“index.html”，默认设置下会自动连接上刚才配置的本地的Aria2 RPC模式。然后你便可以像普通下载软件一样对Aria2进行管理了。

![webui-aria2界面](http://ww2.sinaimg.cn/large/6c84b2d6gw1f1o5q4ljyqj20vv0nvgq4.jpg)

## 开始下载
安装或手动执行脚本后，在P站画师的页面会生成一个按钮。

![页面位置](http://ww4.sinaimg.cn/large/6c84b2d6gw1f1ohqawkotj20ew0dngni.jpg)

需要只下载单图/多图/动图，请先点到作者作品目录里对应筛选中去。筛选TAG同理。

![支持筛选](http://ww4.sinaimg.cn/large/6c84b2d6gw1f1ohp4vafoj20n10boq50.jpg)

点击进行分析后即可自动发送到设置的Aria2下载（下图来自老版本）。

![下载状态](http://ww1.sinaimg.cn/large/6c84b2d6gw1f1ky66pylwj21gs0utasp.jpg)

流量不够也可导出成批处理命令或者会话文件拿回家下载，多个文件可以简单的换行合并。

![导出窗口](http://ww1.sinaimg.cn/large/6c84b2d6gw1f1o5wn8jlsj20ah067js9.jpg)

使用会话文件的命令行为`aria2c.exe --input-file="filename"`

默认设置，下载会将不同画师作品分文件夹存放，每个画师里多图则再建一个文件夹。

![默认结构](http://ww2.sinaimg.cn/large/6c84b2d6gw1f1o64ilrutj20fe09caax.jpg)

![画师文件夹](http://ww1.sinaimg.cn/large/6c84b2d6gw1f1kym1a6ytj20ha07nt9o.jpg)

![多图文件夹](http://ww3.sinaimg.cn/large/6c84b2d6gw1f1kymkw0iwj20id06x0u1.jpg)

需要修改请参考下方设置
## 设置
![设置界面](http://ww3.sinaimg.cn/large/6c84b2d6gw1f2dwvwda6rj20ad0b1wfu.jpg)

为了方便批处理与会话文件的使用，以及方便将Aria2同时用在其他地方（比如批量下载百度云），v1.4.0版本开始添加了内置的下载目录设置，请在下载前先修改下载目录到你所需要的地方。留空时则使用“aria2_Pixiv.ini”里设定了的默认下载目录的位置。

保存路径负责根据画师、作品名进行分类建立文件夹和改名，使用掩码进行自动重命名。

掩码格式为“%{掩码名}”，可用的掩码有如下这些
```
user_id : 作者ID
user_name : 作者昵称
user_account : 作者账户
user_head : 作者头像url
illust_count : 作品总数
illust_file_count : 作品文件总数（含多图）
illust_id : 作品ID
title : 作品标题
illust_page : 在作者的第几页
illust_index : 全部作品中序号（会因为发布新作品而增加）
illust_index_inverted : 全部作品中序号_倒序
illust_index_in_page : 该页上序号
illust_index_in_page_inverted : 该页上序号_倒序
type : 类型，单页0、多图1、动画2、漫画3
type_name : 类型用文字表示
multiple : 只在type=1时启用，其他情况替换为空。
filename : 文件名
	▲如下掩码可组合出相同值
	“%{illust_id}%{hash}_p%{page}”
hash : 仅好友可见图片的加密字符串
extention : 扩展名
page : 第几页（漫画）
page_count : 共几页（漫画）
original_src : 原始图片链接
	▲如下掩码可组合出相同值
	“http://%{domain}/img-original/img/%{year}/%{month}/%{day}/%{hour}/%{minute}/%{second}/%{filename}.%{extention}”
thumbnail_src : 缩略图地址
	▲如下掩码可组合出相同值
	类型命名掩码“%{type_name}”的值设置为动图“_s”，其他为“_master1200”
	“http://%{domain}/c/150x150/img-master/img/%{year}/%{month}/%{day}/%{hour}/%{minute}/%{second}/%{filename}%{type_name}.%{extention}”
url : 作品页面
	▲如下掩码可组合出相同值
	“http://www.pixiv.net/member_illust.php?id=%{illust_id}”
domain : 域名
year : 年
month : 月
day : 日
hour : 时
minute : 分
second : 秒
time : 显示时间
size : 显示大小
width : 宽
height : 高
tools : 使用工具
caption : 说明
tags : 标签
```
##支持Aria2搭建NAS远程下载
Aria2是跨平台下载软件，你可以在其他系统下配置本程序，MacOS、Linux我不会，安卓上运行Aria2请参考[不需root用aria2搭建NAS方法](http://cn.club.vmall.com/thread-3861317-1-1.html)

在我的华为盒子（M330）上配置了Aria2，然后打开路由的端口映射，在单位办公室成功访问（看你的网络通畅情况）。

注意Linux（含安卓）系一定得改用左斜杠，不然无法正确生成路径。

![脚本的设置](http://ww3.sinaimg.cn/large/6c84b2d6jw1f2eano3hd7j20al0bign5.jpg)

因为开公网访问需要设置加密，在Aria2配置文件中加入如下。更多Aria2选项请访问 https://aria2.github.io/manual/en/html/aria2c.html#options
```ini
# token验证
rpc-secret=访问密码
```
脚本设置中的RPC路径为
`http://token:访问密码@域名:端口/jsonrpc`

webui-aria2则这样设置

![网页端的设置](http://ww4.sinaimg.cn/large/6c84b2d6jw1f2eao7814vj20sa0jbadz.jpg)

成功的下载到安卓电视盒子里，可以通过其他手段访问盒子里的文件（我下载到扩展SD卡的）。

![电视盒子上运行的Aria2](http://ww3.sinaimg.cn/large/6c84b2d6gw1f2eajkd4l6j21be0qotkh.jpg)

今天在办公室电视机顶盒上成功连上家里的安卓电视盒子并下载。

![办公室的电脑连上家里的电视盒子](http://ww3.sinaimg.cn/large/6c84b2d6gw1f2f00lxifoj20vl0hs0ue.jpg)

经测试脚本在安卓火狐用usi无法正常工作，原因暂未知。感兴趣还可以尝试从电脑上发送到手机下载之类的奇怪行为。