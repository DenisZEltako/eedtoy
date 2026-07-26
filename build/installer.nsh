!include "LogicLib.nsh"

!macro customInstall
  SetDetailsView show
  DetailPrint "EEDTOY: Python-Laufzeit wird vorbereitet..."
  IfFileExists "$INSTDIR\resources\python\bootstrap_runtime.cmd" 0 python_missing

  ExecWait '"$INSTDIR\resources\python\bootstrap_runtime.cmd"' $0
  ${If} $0 != 0
    MessageBox MB_ICONSTOP|MB_OK "Die benötigte EEDTOY Python-Laufzeit konnte nicht vollständig installiert werden.$\r$\n$\r$\nBitte Internetverbindung und Windows-Paketverwaltung prüfen und die Installation erneut starten."
    Abort
  ${EndIf}

  DetailPrint "EEDTOY: Python-Laufzeit wurde erfolgreich eingerichtet."
  Goto python_done

  python_missing:
    MessageBox MB_ICONSTOP|MB_OK "Die Python-Installationsdateien von EEDTOY fehlen. Die Installation wird abgebrochen."
    Abort

  python_done:
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
