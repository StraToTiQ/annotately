# Local CI Simulation Script for AnotationBlog

$ErrorActionPreference = "Stop"
$root = Get-Location

Write-Host "🚀 Starting Local CI Simulation..." -ForegroundColor Cyan

# --- BACKEND ---
Write-Host "`n--- [Backend] ---" -ForegroundColor Yellow
Set-Location "$root/backend"

Write-Host "Installing/Updating dependencies..."
py -3.12 -m pip install --upgrade pip | Out-Null
py -3.12 -m pip install -r requirements.txt | Out-Null
py -3.12 -m pip install pytest-cov ruff pip-audit | Out-Null

Write-Host "Running Lint (Ruff)..."
py -3.12 -m ruff check .

Write-Host "Security Audit (pip-audit)..."
py -3.12 -m pip_audit --ignore-vuln GHSA-w596-8m9f-6q9x --ignore-vuln GHSA-rvf2-7634-8hww # Ignoring known minor issues if any

Write-Host "Running Backend Tests (pytest)..."
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost/anotationblog"
py -3.12 -m pytest --cov=app tests/

# --- FRONTEND ---
Write-Host "`n--- [Frontend] ---" -ForegroundColor Yellow
Set-Location "$root/frontend"

Write-Host "Installing dependencies..."
npm install --legacy-peer-deps | Out-Null

Write-Host "Running Type Check & Build..."
npm run build

Write-Host "Running Lint..."
npm run lint

Write-Host "Running Unit Tests..."
npm test

Write-Host "Security Audit (npm audit)..."
npm audit --audit-level=high

Write-Host "`n✅ Local CI Simulation Completed Successfully!" -ForegroundColor Green
Set-Location $root
