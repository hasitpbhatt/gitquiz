$ErrorActionPreference = 'Stop'
$courses = Get-ChildItem -LiteralPath "courses" -Directory | ForEach-Object { $_.Name }
foreach ($course in $courses) {
  $files = Get-ChildItem -LiteralPath "courses/$course" -Filter "*.json" | Sort-Object Name
  $chaptersWithZeroHard = @()
  $totalE = 0; $totalM = 0; $totalH = 0; $total = 0
  foreach ($f in $files) {
    $data = Get-Content -LiteralPath $f.FullName -Raw | ConvertFrom-Json
    $e = 0; $m = 0; $h = 0
    foreach ($q in $data) {
      $d = $q.difficulty
      if ($d -eq "easy") { $e++ } elseif ($d -eq "medium") { $m++ } elseif ($d -eq "hard") { $h++ }
    }
    if ($h -eq 0) { $chaptersWithZeroHard += $f.Name }
    $totalE += $e; $totalM += $m; $totalH += $h; $total += ($e+$m+$h)
  }
  $pctE = if ($total -gt 0) { [math]::Round($totalE/$total*100,1) } else { 0 }
  $pctM = if ($total -gt 0) { [math]::Round($totalM/$total*100,1) } else { 0 }
  $pctH = if ($total -gt 0) { [math]::Round($totalH/$total*100,1) } else { 0 }
  $flags = @()
  if ($pctE -lt 30) { $flags += "E${pctE}%<30" }
  if ($pctE -gt 40) { $flags += "E${pctE}%>40" }
  if ($pctM -lt 35) { $flags += "M${pctM}%<35" }
  if ($pctM -gt 45) { $flags += "M${pctM}%>45" }
  if ($pctH -lt 15) { $flags += "H${pctH}%<15" }
  if ($pctH -gt 25) { $flags += "H${pctH}%>25" }
  if ($chaptersWithZeroHard.Count -gt 0) { $flags += "ZERO_HARD: $($chaptersWithZeroHard -join ',')" }
  $status = if ($flags.Count -eq 0) { "PASS" } else { $flags -join ' | ' }
  Write-Host "$course`: E${pctE}%/M${pctM}%/H${pctH}% [$status]"
}
