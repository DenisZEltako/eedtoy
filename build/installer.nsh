!include "LogicLib.nsh"

!macro customInstall
  DetailPrint "EEDTOY: Python runtime is being prepared..."
  IfFileExists "$INSTDIR\resources\python\bootstrap_runtime.cmd" 0 +2
    ExecWait '"$INSTDIR\resources\python\bootstrap_runtime.cmd"'

  CreateDirectory "$APPDATA\eedtoy"
  ${If} $LANGUAGE == 1031
    FileOpen $0 "$APPDATA\eedtoy\language.txt" w
    FileWrite $0 "de"
  ${Else}
    FileOpen $0 "$APPDATA\eedtoy\language.txt" w
    FileWrite $0 "en"
  ${EndIf}
  FileClose $0
!macroend
