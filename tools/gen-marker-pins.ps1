# Generate numbered map pin PNGs (brand teal #2A9D8F, white number, white outline)
# Output: miniprogram/images/markers/pin-1.png ... pin-20.png + pin-n.png (no-number fallback)
# Usage: powershell -ExecutionPolicy Bypass -File tools\gen-marker-pins.ps1
# NOTE: keep this file ASCII-only. PS 5.1 reads BOM-less files as ANSI, so non-ASCII
# comments garble the parse.
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root "miniprogram\images\markers"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$tealBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#2A9D8F"))
$whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)

function New-Pin([string]$fileName, [string]$numText) {
  $bmp = New-Object System.Drawing.Bitmap 48, 58
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  # White outline layer (head circle + tail triangle, slightly larger than fill)
  $g.FillEllipse($whiteBrush, 6, 2, 36, 36)
  $triW = [System.Drawing.Point[]]@(
    (New-Object System.Drawing.Point 11, 32),
    (New-Object System.Drawing.Point 37, 32),
    (New-Object System.Drawing.Point 24, 56))
  $g.FillPolygon($whiteBrush, $triW)

  # Teal fill layer
  $g.FillEllipse($tealBrush, 8.5, 4.5, 31, 31)
  $triT = [System.Drawing.Point[]]@(
    (New-Object System.Drawing.Point 14, 34),
    (New-Object System.Drawing.Point 34, 34),
    (New-Object System.Drawing.Point 24, 56))
  $g.FillPolygon($tealBrush, $triT)

  # White number, centered in the head circle
  if ($numText) {
    if ($numText.Length -eq 1) { $size = 17 } else { $size = 13.5 }
    $font = New-Object System.Drawing.Font("Arial", $size, [System.Drawing.FontStyle]::Bold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF 0, 0, 48, 40
    $g.DrawString($numText, $font, $whiteBrush, $rect, $sf)
    $font.Dispose()
    $sf.Dispose()
  }

  $bmp.Save((Join-Path $outDir $fileName), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

1..20 | ForEach-Object { New-Pin "pin-$_.png" "$_" }
New-Pin "pin-n.png" $null

$tealBrush.Dispose()
$whiteBrush.Dispose()
Write-Output "done: $outDir"
