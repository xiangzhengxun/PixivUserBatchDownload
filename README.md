# PixivUserBatchDownload v5.x
[P站](http://www.pixiv.net/member.php?id=3896348)画师个人作品批量下载工具，简称PUBD。

* #### 为什么要做PUBD？
  PUBD的理念是在阅览P站的过程中，看见喜欢的画师，可以直接一键下载该画师的所有作品。

  融入网页的体验，不需要专门打开其他程序。
  
* #### PUBD都有哪些功能？
  PUBD的功能主要是可以下载画师所有公开作品，并且可以自定义下载路径、文件名。
  
  可以发送到家里的路由、租用的VPS、家里的安卓智能电视等远程地址下载。（做远程主要是因为我单位上网收流量费 :cry:）

![程序运行图](https://raw.githubusercontent.com/wiki/Mapaler/PixivUserBatchDownload/images/preview.png)

## 程序结构
PUBD主体部分是采用JavaScript语言编写的用户脚本，v5.0版分离了用户界面到单独的用户样式文件。

下载流程的结构如下图<br>
![结构图](https://raw.githubusercontent.com/wiki/Mapaler/PixivUserBatchDownload/images/structure.jpg)

## 后续功能开发状态
- [x] 下载逐项发送（不卡死）
- [x] 输出文本信息（下载列表）
- [ ] 多画师批量下载
- [x] 子菜单快速完成操作（已开发但暂未使用）
- [ ] Tab选项卡式面板
- [ ] 仅下载当前一幅作品
- [x] 下载过滤器

## License|许可协议
PixivUserBatchDownload v5.x Copyright(C) 2017 by Mapaler

此程序是免费软件。你可以将它根据“GNU通用公共许可证第三版(GPLv3)”重新分发和/或修改。

* Aria2操作对象代码来自[ThunderLixianExporter](https://github.com/binux/ThunderLixianExporter)。
* Pixiv APP-API分析来自[PixivPy](https://github.com/upbit/pixivpy)。

## 使用说明
请访问▶ **[PUBD Wiki](https://github.com/Mapaler/PixivUserBatchDownload/wiki)** ◀阅读。

## 程序下载
为了方便扩展自动更新PUBD，我将两部分都发布到了扩展支持自动更新的网站，建议到这里安装。

* [用户脚本部分(Greasy Fork)](https://greasyfork.org/zh-CN/scripts/17879)
* [用户样式部分(userstyles.org)](https://userstyles.org/styles/137583)