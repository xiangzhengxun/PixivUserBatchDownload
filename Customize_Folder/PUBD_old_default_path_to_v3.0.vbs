'*************************************
' 本程序用于将P站画师个人作品批量下载工具老版本默认目录转换为
' v3.0版新添加的自定义文件夹功能需要的目录
' 
' https://github.com/Mapaler/PixivUserBatchDownload
'*************************************
Dim downDir
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

Set ws = CreateObject("WScript.Shell")
set fs = CreateObject("Scripting.FileSystemObject")

Set root = fs.GetFolder("k:\Image\P站\")
For each user in root.SubFolders
	WScript.Echo "正在处理 " & user.Name
	Set inuser = isCutPath(user)
	For each muilt in inuser.SubFolders
		Set inmuilt = isCutPath(muilt)
		For each file in inmuilt.Files
			'WScript.Echo file.Name & " move to " & inuser.Path
			file.Move inuser.Path & "\" & file.Name
		Next
		'WScript.Echo "Delete " & muilt.Path
		muilt.Delete
	Next
Next

Function isCutPath(folder)
	If folder.SubFolders.Count = 1 And folder.Files.Count = 0 Then
		For each fol in folder.SubFolders
			Set isCutPath = isCutPath(fol)
		Next
	Else
		Set isCutPath = folder
	End If
End Function