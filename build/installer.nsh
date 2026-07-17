!macro customInstall
  DetailPrint "EEDTOY: Python-Laufzeit wird vorbereitet..."
  IfFileExists "$INSTDIR\resources\python\bootstrap_runtime.cmd" 0 +2
    ExecWait '"$INSTDIR\resources\python\bootstrap_runtime.cmd"'
!macroend
