Set ws = CreateObject("WScript.Shell")
set fs = CreateObject("Scripting.FileSystemObject")

p_ncvt = "nconvert.exe" 'NConvert程序路径

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

Set root = fs.GetFolder("f:\PivixDownload - 副本\")
For each user in root.SubFolders
	oldAttributes = user.Attributes
	For each file in user.Files
		If fs.GetExtensionName(file) = "torrent" Then
			file.Move file.ParentFolder & "\Desktop.ini"
			file.Attributes = FILE_ATTRIBUTE_HIDDEN Or FILE_ATTRIBUTE_SYSTEM Or FILE_ATTRIBUTE_ARCHIVE
		ElseIf file.name = "head.image" Then
			'转格式的命令行
			command = """" & p_ncvt & """ -resize 256 256 -out ico -q -truecolors "
			command = command & " -D" '删除原始文件
			command = command & " -overwrite" '覆盖存在文件
			command = command & " """ & file.Path & """"
			Set oExec = ws.Exec(command)
			strErr = oExec.StdErr.ReadAll() '加上是为了保持完成后再继续
			Set icofile = fs.GetFile(file.ParentFolder & "\head.ico")
			icofile.Attributes = FILE_ATTRIBUTE_HIDDEN Or FILE_ATTRIBUTE_SYSTEM Or FILE_ATTRIBUTE_ARCHIVE
		End If
	Next
	user.Attributes = FILE_ATTRIBUTE_READONLY Or FILE_ATTRIBUTE_DIRECTORY Or FILE_ATTRIBUTE_HIDDEN Or FILE_ATTRIBUTE_SYSTEM
	user.Attributes = FILE_ATTRIBUTE_READONLY Or FILE_ATTRIBUTE_DIRECTORY
Next