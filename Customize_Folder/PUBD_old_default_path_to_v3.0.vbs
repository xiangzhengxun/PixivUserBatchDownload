'*************************************
' 本程序用于将P站画师个人作品批量下载工具老版本默认目录转换为
' v3.0版新添加的自定义文件夹功能需要的目录
' 
' https://github.com/Mapaler/PixivUserBatchDownload
'*************************************
Dim downDir
Set ws = CreateObject("WScript.Shell")
set fs = CreateObject("Scripting.FileSystemObject")

If InStr(WScript.FullName,"wscript.exe") Then
	Set ws = CreateObject("WScript.Shell")
	ws.Run "cscript.exe """ & WScript.ScriptFullName & """ """ & WScript.Arguments(0) & """"
	WScript.Quit
End If

If WScript.Arguments.Count>0 Then
	downDir = WScript.Arguments(0)
End If
If Not fs.FolderExists(downDir) Then
	downDir = InputBox("输入P站图片下载根目录，既所有用户所在文件夹。" & vbCrLf & vbCrLf & "有时运行可能会执行失败，请多尝试几次，直到显示“处理完成”。","路径批量更改脚本")
End If
If Not fs.FolderExists(downDir) Then
	WScript.Echo "图片目录不存在"
	WScript.Quit
End If


Set root = fs.GetFolder(downDir)
Dim numName
For each user in root.SubFolders
	WScript.Echo "正在处理 " & user.Name
	Set inuser = isCutPath(user)
	For each muilt in inuser.SubFolders
		Set inmuilt = isCutPath(muilt)
		For each file in inmuilt.Files
			'WScript.Echo file.Name & " move to " & user.Path
			file.Move user.Path & "\" & file.Name
		Next
		'WScript.Echo "Delete " & muilt.Path
		muilt.Delete
	Next
	If user.Path <> inuser.Path Then
		'WScript.Echo "Delete " & inuser.Path
		inuser.Delete
	End If
	numName = Split(user.Name,"_")
	If Not fs.FolderExists(root.Path & "\" & numName(0)) Then
		user.Move root.Path & "\" & numName(0)
	End If
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

MsgBox "处理完成"