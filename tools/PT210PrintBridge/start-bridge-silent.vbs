Set objFSO = CreateObject("Scripting.FileSystemObject")
scriptDir = objFSO.GetParentFolderName(WScript.ScriptFullName)
targetExe = scriptDir & "\bin\Release\net8.0\PT210PrintBridge.exe"
workingDir = scriptDir & "\bin\Release\net8.0"

Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = workingDir
WshShell.Run Chr(34) & targetExe & Chr(34), 0, False
