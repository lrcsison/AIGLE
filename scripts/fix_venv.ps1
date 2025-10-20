Param(
  Param(
    [string]$pythonPath
  )

  # fix_venv.ps1
  # Recreate a clean .venv in the current project folder and install dependencies.
  # Usage: from project root run: powershell -File .\scripts\fix_venv.ps1

  Write-Host "fix_venv: running in" (Get-Location)

  # Remove existing .venv if present
  if (Test-Path .\.venv) {
    Write-Host "Removing existing .venv" -ForegroundColor Yellow
    Remove-Item -Recurse -Force .\.venv
  }

  # Find python
  if ($pythonPath) {
    $pythonExe = $pythonPath
  } else {
    $cmd = Get-Command python -ErrorAction SilentlyContinue
    if ($cmd) { $pythonExe = $cmd.Source } else { $pythonExe = $null }
    if (-not $pythonExe) {
      $pyLauncher = Get-Command py -ErrorAction SilentlyContinue
      if ($pyLauncher) { $pythonExe = "$($pyLauncher.Source) -3" }
    }
  }

  if (-not $pythonExe) {
    Write-Host "ERROR: No python executable found. Provide -pythonPath or ensure 'python' is on PATH." -ForegroundColor Red
    exit 1
  }

  Write-Host "Using python: $pythonExe"

  # Create venv
  Write-Host "Creating .venv..."
  try { & $pythonExe -m venv .venv } catch { Write-Host "Failed to create venv: $_" -ForegroundColor Red; exit 1 }

  # Use venv python to install packages
  $venvPython = Join-Path (Get-Location) ".venv\Scripts\python.exe"
  if (-not (Test-Path $venvPython)) { Write-Host "ERROR: venv python not found at $venvPython" -ForegroundColor Red; exit 1 }

  Write-Host "Upgrading pip and installing dependencies using $venvPython"
  & $venvPython -m pip install --upgrade pip setuptools wheel

  if (Test-Path requirements.txt) {
    $req = Get-Content requirements.txt -Raw
    if ($req.Trim().Length -gt 0) {
      Write-Host "Installing from requirements.txt..."
      & $venvPython -m pip install -r requirements.txt
      Write-Host "Installed requirements from requirements.txt" -ForegroundColor Green
      Write-Host "Done. To run the app: .\\.venv\\Scripts\\Activate.ps1 or .venv\\Scripts\\python.exe app.py" -ForegroundColor Green
      exit 0
    }
  }

  Write-Host "No requirements.txt or file is empty — installing minimal set: Flask, python-dotenv, flask-cors" -ForegroundColor Yellow
  & $venvPython -m pip install Flask python-dotenv flask-cors
  Write-Host "Installed minimal dependencies" -ForegroundColor Green
  Write-Host "Done. To run the app: .\\.venv\\Scripts\\Activate.ps1 or .venv\\Scripts\\python.exe app.py" -ForegroundColor Green
      Write-Host "Done. To run the app: .\\.venv\\Scripts\\Activate.ps1  (or use .venv\\Scripts\\python.exe app.py)" -ForegroundColor Green
      exit 0
    }
  }

  Write-Host "No requirements.txt or file is empty — installing minimal set: Flask, python-dotenv, flask-cors" -ForegroundColor Yellow
  & $venvPython -m pip install Flask python-dotenv flask-cors
  Write-Host "Installed minimal dependencies" -ForegroundColor Green
  Write-Host "Done. To run the app: .\\.venv\\Scripts\\Activate.ps1  (or use .venv\\Scripts\\python.exe app.py)" -ForegroundColor Green
# Fallback: install minimal set
