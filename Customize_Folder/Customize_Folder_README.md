# 文件夹自定义工具使用方法
P站画师个人作品批量下载工具3.0版开始支持自定义文件夹名与图标。

因为JavaScript无法直接操控本地文件，因此必须使用本地脚本来帮助完成。

使用前建议先重置设置。之后的“Desktop.ini”将放在下载目录下，因此将“%{user_id}”掩码位置从 保存路径 更改到 下载目录 中。
![注意设置](http://ww1.sinaimg.cn/large/6c84b2d6gw1f2vhxf7yrzj20bb0bcwfr.jpg)
使用RPC模式下载完成后会生成一个“torrent”文件，和一个“head.image”。

下载[NConvert](http://www.xnview.com/en/nconvert/)，将“nconvert.exe”放到“PUBD_customize_folder.vbs”同一文件夹，然后运行“PUBD_customize_folder.vbs”，也可将文件夹拖到脚本上打开，频繁使用可直接修改程序内默认地址路径。
![放置](http://ww4.sinaimg.cn/large/6c84b2d6gw1f2vi15qw7ij20gn01gt8s.jpg)
程序会自动将“torrent”文件还原回“Desktop.ini”，“head.image”转换为图标文件。