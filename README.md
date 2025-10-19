# AigleWeb (v5)

This repository contains the AigleWeb Flask application (v5).

Quick start (local development)

1. Create a Python virtual environment and install dependencies.

PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and fill in secrets (do NOT commit `.env`).

3. Run the app:

```powershell
$env:FLASK_APP = "app.py"
$env:FLASK_ENV = "development"
python app.py
```

4. Open http://127.0.0.1:5050 in your browser.

Publishing to GitHub

1. Initialize a git repo (if not already):

```powershell
git init
git add .
git commit -m "Initial commit"
```

2. Create a GitHub repository (via website) and follow the instructions to add the remote, for example:

```powershell
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

3. Don't commit secrets. Ensure `.env` is in `.gitignore` before pushing.

Deploying (high level)

- For a Python/Flask app, recommended hosts: Render, Fly.io, Railway, DigitalOcean App Platform, Azure App Service.
- For a static build (if you export static HTML), you can use Vercel or Netlify.

Security

- Keep secrets in environment variables (don't commit `.env`).
- Rotate API keys if accidentally committed.

If you want, I can:
- Create a ready-to-push Git history for you here.
- Add a GitHub Actions workflow for automatic deploy to Render or Azure.
- Add a `requirements.txt` (if missing) and a short deploy playbook.

Tell me which of the above you'd like next and I'll implement it.

---

## Security checklist (important)

- Never commit your `.env` file or any file containing API keys or private tokens. This repository includes `.env.example` to show required variables — copy it locally:

```powershell
Copy-Item .\.env.example .\.env
# Edit .env and fill values locally; do not commit .env
```

- Before pushing, run a quick scan for common secret patterns (PowerShell):

```powershell
# basic scan for common key patterns
Select-String -Path * -Pattern "AIza|AKIA|SECRET|PRIVATE_KEY|password|TOKEN|api_key|SUPABASE_KEY" -SimpleMatch -NotMatch '\.git\\' | Select-Object Path, LineNumber, Line
```

- If you accidentally committed secrets, rotate those secrets immediately and remove them from git history (tools like `git filter-repo` or GitHub support can help).

- `.gitignore` in this repo already ignores `.env` and common build artifacts. Double-check before the initial push.

If you want, I can run the secrets scan here and produce a short report of files that match.