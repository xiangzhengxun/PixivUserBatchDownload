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