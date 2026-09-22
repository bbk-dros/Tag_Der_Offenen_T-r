# Kleiner Webserver fuer die Gesten-Spiele - ohne Installation.
#
# Warum ueberhaupt ein Server? Der Browser gibt Kamera und KI-Modelle nur
# frei, wenn die Seite ueber http://localhost kommt, nicht per Doppelklick
# als Datei. Laeuft unter Windows PowerShell 5.1 und PowerShell 7.
#
# Aufruf: start.cmd doppelklicken  (oder: .\server.ps1 -Port 8123)

param(
    [int]$Port = 8123,
    [switch]$NoBrowser
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$prefix = "http://localhost:$Port/"

$mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'text/javascript; charset=utf-8'
    '.mjs'  = 'text/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.md'   = 'text/plain; charset=utf-8'
    '.wasm' = 'application/wasm'
    '.task' = 'application/octet-stream'
    '.png'  = 'image/png'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
try {
    $listener.Start()
} catch {
    # Meist laeuft der Server schon in einem anderen Fenster - dann nur den Browser oeffnen.
    try {
        Invoke-WebRequest -Uri "$($prefix)index.html" -UseBasicParsing -TimeoutSec 3 | Out-Null
        Write-Host "Der Server laeuft bereits. Der Browser wird geoeffnet." -ForegroundColor Yellow
        if (-not $NoBrowser) { Start-Process $prefix }
        Start-Sleep -Seconds 3
        exit 0
    } catch {
        Write-Host "Port $Port ist von einem anderen Programm belegt. Anderen Port waehlen: .\server.ps1 -Port 8124" -ForegroundColor Red
        Read-Host 'Enter zum Beenden'
        exit 1
    }
}

Write-Host ''
Write-Host "  Gesten-Spiele laufen auf $prefix" -ForegroundColor Green
Write-Host '  Dieses Fenster offen lassen. Beenden mit Strg+C.'
Write-Host ''

if (-not $NoBrowser) { Start-Process $prefix }

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        try {
            $path = [Uri]::UnescapeDataString($request.Url.AbsolutePath).TrimStart('/')
            if ($path -eq '') { $path = 'index.html' }
            $file = [IO.Path]::GetFullPath((Join-Path $root $path))

            if (-not $file.StartsWith($root) -or -not (Test-Path $file -PathType Leaf)) {
                $response.StatusCode = 404
            } else {
                $ext = [IO.Path]::GetExtension($file).ToLower()
                $type = $mime[$ext]
                if (-not $type) { $type = 'application/octet-stream' }
                $response.ContentType = $type
                $response.Headers.Add('Cache-Control', 'no-cache')
                $stream = [IO.File]::OpenRead($file)
                try {
                    $response.ContentLength64 = $stream.Length
                    $stream.CopyTo($response.OutputStream)
                } finally {
                    $stream.Dispose()
                }
            }
        } catch {
            # Browser hat die Verbindung abgebrochen (z. B. Seite neu geladen) - egal.
        } finally {
            try { $response.Close() } catch { }
        }
    }
} finally {
    $listener.Stop()
}
