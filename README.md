# PixivUserBatchDownload
[P站](http://www.pixiv.net/member.php?id=3896348)画师个人作品批量下载工具，本程序仅支持P站电脑版登录后的网页。

建议使用[火狐](http://www.firefox.com)的[GreaseMonkey](http://www.greasespot.net/)扩展[安装本脚本程序](https://github.com/Mapaler/PixivUserBatchDownload/raw/master/PixivUesrBatchDownload.user.js)，因为Chrome技术原因仅提供有限功能支持，Chrome虽然原生支持但还是建议装Tampermonkey扩展。

需要配和[Aria2](https://aria2.github.io/)下载软件使用，推荐使用PRC模式并用[webui-aria2](https://github.com/ziahamza/webui-aria2)管理下载。

## 配置Aria2
[下载最新的Aria2](https://github.com/tatsuhiro-t/aria2/releases)，比如我下载的是64位Windows版“aria2-1.20.0-win-64bit-build1.zip”，然后解压到文件夹。

在aria2c路径下新建文本文件，内容为，并将扩展名更改为bat。

`aria2c.exe --conf-path="aria2.conf"`

然后继续建立“aria2.conf”，内容为。虽然也可以把这些参数写在命令行，但是写在设置文件里更清楚。
```ini
# 保存路径请自行修改
dir=D:\Pictures\PixivUserBatchDownload
# 禁用覆盖（跳过已下载的）
allow-overwrite=false
# 禁用重命名（跳过已下载的）
auto-file-renaming=false
# 修改为服务器时间
remote-time=true

# 开启RPC选项
enable-rpc=true
pause=false
rpc-allow-origin-all=true
rpc-listen-all=true
rpc-save-upload-metadata=true
rpc-secure=false
```
![文件示例](http://ww2.sinaimg.cn/large/6c84b2d6gw1f1o5iqlyu5j20io0f60vv.jpg)

然后运行bat文件即可开启Aria2的RPC模式。

[下载最新的webui-aria2（有中文）](https://github.com/ziahamza/webui-aria2/archive/master.zip)，然后解压到文件夹，打开“index.html”，默认设置下会自动连接上刚才配置的本地的Aria2 RPC模式。然后你便可以像普通下载软件一样对Aria2进行管理了。（还可将webui-aria2下到手机，更改设置里的RPC路径访问电脑上的Aria2）

![webui-aria2界面](http://ww2.sinaimg.cn/large/6c84b2d6gw1f1o5q4ljyqj20vv0nvgq4.jpg)

Aria2是跨平台下载软件，你可以在其他系统下配置本程序，MacOS、Linux我不会，安卓上运行Aria2请参考[不需root用aria2搭建NAS方法](http://cn.club.vmall.com/thread-3861317-1-1.html)

更多Aria2选项请访问 https://aria2.github.io/manual/en/html/aria2c.html#options

## 开始下载
安装或手动执行脚本后，在P站画师的页面会生成一个按钮。

![页面位置](http://ww4.sinaimg.cn/large/6c84b2d6gw1f1ohqawkotj20ew0dngni.jpg)

需要只下载单图/多图/动图，请先点到作者作品目录里对应筛选中去。筛选TAG同理。

![支持筛选](http://ww4.sinaimg.cn/large/6c84b2d6gw1f1ohp4vafoj20n10boq50.jpg)

点击进行分析后即可自动发送到设置的Aria2下载。

![下载状态](http://ww1.sinaimg.cn/large/6c84b2d6gw1f1ky66pylwj21gs0utasp.jpg)

流量不够也可导出成bat命令或者down文件拿回家下载。

![导出窗口](http://ww1.sinaimg.cn/large/6c84b2d6gw1f1o5wn8jlsj20ah067js9.jpg)

使用down文件的命令行为`aria2c.exe --input-file="filename.down"`

默认设置，下载会将不同画师作品分文件夹存放，每个画师里多图则再建一个文件夹。

![默认结构](http://ww2.sinaimg.cn/large/6c84b2d6gw1f1o64ilrutj20fe09caax.jpg)

![画师文件夹](http://ww1.sinaimg.cn/large/6c84b2d6gw1f1kym1a6ytj20ha07nt9o.jpg)

![多图文件夹](http://ww3.sinaimg.cn/large/6c84b2d6gw1f1kymkw0iwj20id06x0u1.jpg)

需要修改请参考下方设置
## 设置
![设置界面](http://ww4.sinaimg.cn/large/6c84b2d6gw1f1kxnqiz44j20aj0as0tu.jpg)

因为已经在“aria2.conf”里设定了下载父文件夹的位置，因此这里只需要写子文件夹路径就可以了。

掩码格式为“%{掩码名}”，可用的掩码有如下这些
```
user_id : 作者ID
user_name : 作者昵称
illust_count : 作品总数
illust_file_count : 作品文件总数（含多图）
illust_id : 作品ID
title : 作品标题
illust_page : 在作者的第几页
illust_index : 全部作品中序号（会因为发布新作品而增加）
illust_index_inverted : 全部作品中序号_倒序
illust_index_in_page : 该页上序号
illust_index_in_page_inverted : 该页上序号_倒序
type : 类型，单页0、漫画1、动画2
type_name : 类型用文字表示
multiple : 只在type=1时启用，其他情况替换为空。
filename : 文件名
extention : 扩展名
page : 第几页（漫画）
page_count : 共几页（漫画）
original_src : 原始图片链接
thumbnail_src : 缩略图地址
domain : 域名
url : 作品页面
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
## License|许可协议
用到了一部分[ThunderLixianExporter](https://github.com/binux/ThunderLixianExporter)的代码

PixivUserBatchDownload Copyright(C) 2016 by Mapaler

此程序是免费软件。你可以将它根据GNU通用公共许可证第三版重新分发和/或修改。[LICENSE](https://github.com/Mapaler/PixivUserBatchDownload/blob/master/LICENSE)

如果你想分发你修改后的程序，但是你不想要公布修改后的源代码，请与我联系。