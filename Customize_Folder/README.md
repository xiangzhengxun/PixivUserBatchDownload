# 文件夹自定义工具使用方法
因为老版本的路径命名方式经常因作者更名而改变（比如参加ComicMart就在名字里加上摊位），因此3.0开始默认文件名只保留不变的数字id。而这样一来全都是数字的文件夹无法辨识作者是谁了，于是3.0版使用自定义文件夹名与图标来解决这一问题。

文件夹自定义用“Desktop.ini”控制显示，而且这样还不受文件名特殊字符限制。加上用头像做成图标，画师的辨识度更高了。缺点是只有Windows Explorer默认支持。

因为JavaScript无法直接操控本地文件，因此必须使用本地脚本来帮助完成以下功能。

##老版路径转移到v3.0新版路径
做了一个自动批量将老版默认的路径转换为v3.0默认路径的脚本。之后就不需要重新下载已有的图片了。

[下载链接](https://github.com/Mapaler/PixivUserBatchDownload/raw/develop/Customize_Folder/PUBD_old_default_path_to_v3.0.vbs)

##使用方法
使用前建议先重置设置。因为“Desktop.ini”将分别下载到每个的下载目录，因此将“%{user_id}”掩码位置从 保存路径 更改到 下载目录 中。（***v3.2已改变路径获取方式，不需要这样设置了***，不重置也可以用，但是为了规范新路径格式还是建议重置）

![注意设置](http://ww1.sinaimg.cn/large/6c84b2d6gw1f2vhxf7yrzj20bb0bcwfr.jpg)

使用RPC模式下载完成后会生成一个“torrent”文件，和一个“head.image”。

![下载到的文件](http://ww1.sinaimg.cn/large/6c84b2d6gw1f2w59pru9kj20o30dz404.jpg)

下载[NConvert](http://www.xnview.com/en/nconvert/)和[PUBD_customize_folder.vbs](https://github.com/Mapaler/PixivUserBatchDownload/raw/develop/Customize_Folder/PUBD_customize_folder.vbs)，将“nconvert.exe”放到“PUBD_customize_folder.vbs”同一文件夹。
（本来不想用NConvert的，但是发现处理头像有跨域问题，只好下载到本地再处理了）

![下载](http://ww4.sinaimg.cn/large/6c84b2d6gw1f2w3abw1aoj20fu0a8jrw.jpg)
![放置](http://ww4.sinaimg.cn/large/6c84b2d6gw1f2vi15qw7ij20gn01gt8s.jpg)

然后运行自动处理脚本

1. 直接运行“PUBD_customize_folder.vbs”
	
	![直接运行](http://ww1.sinaimg.cn/large/6c84b2d6gw1f2w5bpw0e3j20mf0d8q4k.jpg)
	
2. 也可将文件夹拖到脚本上打开。
	
	![拖动打开](http://ww4.sinaimg.cn/large/6c84b2d6gw1f2w5dkya6ij20iv0aogmo.jpg)
	
3. 频繁使用可直接修改程序内默认地址路径。
	
	![修改脚本](http://ww3.sinaimg.cn/large/6c84b2d6gw1f2w5enlg2pj20iq0akdh9.jpg)
	
程序会自动将“torrent”文件还原回“Desktop.ini”，“head.image”转换为图标文件。运行结果如下（因为系统图标缓存问题，可能无法立马显示）

![运行结果](http://ww4.sinaimg.cn/large/6c84b2d6gw1f2w5kwzpq0j20le0ahmyv.jpg)

内部图片名也将改变

![内部图片名](http://ww2.sinaimg.cn/large/6c84b2d6gw1f2w5osozjmj21940msn4c.jpg)

##注意
* “Desktop.ini”改变的只是显示名称，实际文件名仍然不变

	![实际文件名](http://ww1.sinaimg.cn/large/6c84b2d6gw1f2w5qy9xgmj20ej0fgq4t.jpg)

* 如果喜欢老版的命名方式，仍然可以自行修改回去。老版保存路径掩码如下，下载目录无掩码。

	`%{user_id}_%{user_name}/%{multiple}%{filename}.%{extention}`
	
	*目前考虑下次改版仍改回类似老版的下载目录无掩码的模式
