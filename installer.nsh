; 禁用 electron-builder 默认的应用程序运行检测
!macro customCheckAppRunning
  ; 跳过进程检测
!macroend

!macro customInit
  ; 检查并关闭正在运行的应用程序进程
  nsExec::ExecToLog 'taskkill /F /IM "小说创作工坊.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM "novel-studio.exe" /T'
  ; 等待进程完全退出
  Sleep 1000
!macroend

!macro customInstall
  ; 安装前再次确保进程已关闭
  nsExec::ExecToLog 'taskkill /F /IM "小说创作工坊.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM "novel-studio.exe" /T'
  Sleep 500
!macroend

!macro customUnInit
  ; 卸载前关闭正在运行的应用程序进程
  nsExec::ExecToLog 'taskkill /F /IM "小说创作工坊.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM "novel-studio.exe" /T'
  Sleep 500
!macroend
