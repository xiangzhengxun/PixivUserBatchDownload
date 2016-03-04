# PixivUserBatchDownload
[P站](http://www.pixiv.net/member.php?id=3896348)画师个人作品批量下载工具，本程序仅支持P站电脑版网页。目前还有一些BUG有待解决（比如某E的图片数量获取有问题所以不开始下载）。

请使用[火狐](http://www.firefox.com)的[GreaseMonkey](http://www.greasespot.net/)扩展安装本脚本程序，我不用Chrome。

需要配和[Aria2](https://aria2.github.io/)使用，推荐使用PRC模式并用[webui-aria2](https://github.com/ziahamza/webui-aria2)管理下载。

## 配置Aria2
在aria2c路径下建立Bat文件，内容为，前面三个参数是启动RPC模式用，第四个是从参数文件读取参数。也可以把前几个参数也写入参数文件。
`aria2c --enable-rpc --rpc-listen-all --rpc-allow-origin-all --conf-path="aria2.conf"`
然后继续建立“aria2.conf”，内容为
```ini
# 保存路径请自行修改
dir=D:\Pictures\PixivUserBatchDownload
# 禁用覆盖
allow-overwrite=false
# 禁用重命名
auto-file-renaming=false
# 修改为服务器时间
remote-time=true
```
![文件示例](http://ww4.sinaimg.cn/large/6c84b2d6gw1f1kyvk0t12j20jh0bxdi6.jpg)

然后运行bat即可开启Aria2的PRC模式。

Linux我不会，安卓上运行Aria2请参考[不需root用aria2搭建NAS方法](http://cn.club.vmall.com/thread-3861317-1-1.html)

## 开始下载
在P站画师的作品目录页面会生成一个按钮

![页面位置](http://ww3.sinaimg.cn/large/6c84b2d6gw1f1kxlcg6gcj20nq0ghgpj.jpg)

点击进行分析后即可自动发送到设定里设置的Aria2 PRC地址下载。

![下载状态](http://ww1.sinaimg.cn/large/6c84b2d6gw1f1ky66pylwj21gs0utasp.jpg)

也可导出成bat命令或者down文件。

使用down文件的命令行为`aria2c -i "filename.down"`

默认设置，下载会将不同画师作品分文件夹存放，每个画师里多图则再建一个文件夹。

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