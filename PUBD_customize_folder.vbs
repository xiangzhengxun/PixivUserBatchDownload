'*************************************
' 本程序用于P站画师个人作品批量下载工具v3.0版新添加的自定义文件夹功能
' 
' https://github.com/Mapaler/PixivUserBatchDownload
'*************************************
Dim downDir
downDir = "" '默认的下载目录
p_ncvt = "nconvert.exe" 'NConvert程序路径

Dim ws,fso
Set ws = CreateObject("WScript.Shell")
set fso = CreateObject("Scripting.FileSystemObject")

If WScript.Arguments.Count>1 Then
	downDir = WScript.Arguments(0)
End If
If Not fso.FolderExists(downDir) Then
	downDir = InputBox("输入P站图片下载根目录，既所有用户所在文件夹。","自定义文件夹脚本")
End If
If Not fso.FolderExists(downDir) Then
	WScript.Echo "图片目录不存在"
	WScript.Quit
End If

Const FILE_ATTRIBUTE_READONLY=1 '只读
Const FILE_ATTRIBUTE_HIDDEN=2 '隐藏
Const FILE_ATTRIBUTE_SYSTEM=4 '系统
Const FILE_ATTRIBUTE_DIRECTORY=16 '目录
Const FILE_ATTRIBUTE_ARCHIVE=32 '存档
Const FILE_ATTRIBUTE_DEVICE=64 '保留
Const FILE_ATTRIBUTE_NORMAL=128 '正常
Const FILE_ATTRIBUTE_TEMPORARY=256 '临时
Const FILE_ATTRIBUTE_SPARSE_FILE=512 '稀疏文件
Const FILE_ATTRIBUTE_REPARSE_POINT=1024 '超链接或快捷方式
Const FILE_ATTRIBUTE_COMPRESSED=2048 '压缩
Const FILE_ATTRIBUTE_OFFLINE=4096 '脱机
Const FILE_ATTRIBUTE_NOT_CONTENT_INDEXED=8192 '索引
Const FILE_ATTRIBUTE_ENCRYPTED=16384 '加密
Const FILE_ATTRIBUTE_VIRTUAL=65536 '虚拟

Set root = fso.GetFolder(downDir)
Dim cstFolder
For each user in root.SubFolders
	cstFolder = False
	'oldAttributes = user.Attributes
	For each file in user.Files
		If fso.GetExtensionName(file) = "torrent" Then
			If fso.FileExists(user.Path & "\Desktop.ini") Then fso.DeleteFile(user.Path & "\Desktop.ini")
			file.Move user.Path & "\Desktop.ini"
			file.Attributes = FILE_ATTRIBUTE_HIDDEN Or FILE_ATTRIBUTE_SYSTEM Or FILE_ATTRIBUTE_ARCHIVE
			cstFolder = True
		ElseIf file.name = "head.image" Then
			'转格式的命令行
			command = """" & p_ncvt & """ -resize 256 256 -out ico -q -truecolors "
			command = command & " -D" '删除原始文件
			command = command & " -overwrite" '覆盖存在文件
			command = command & " """ & file.Path & """"
			Set oExec = ws.Exec(command)
			strErr = oExec.StdErr.ReadAll() '加上是为了保持完成后再继续
			Set icofile = fso.GetFile(user.Path & "\head.ico")
			icofile.Attributes = FILE_ATTRIBUTE_HIDDEN Or FILE_ATTRIBUTE_SYSTEM Or FILE_ATTRIBUTE_ARCHIVE
			If fso.FileExists(user.Path & "\head.image") Then fso.DeleteFile(user.Path & "\head.image")
		End If
	Next
	If cstFolder Then
		user.Attributes = FILE_ATTRIBUTE_READONLY Or FILE_ATTRIBUTE_DIRECTORY
		'user.Attributes = oldAttributes
	End If
Next
WScript.Echo "程序执行完毕"