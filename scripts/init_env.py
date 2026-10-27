"""Create a private lab configuration. Never overwrite an existing .env."""
import argparse
from pathlib import Path
import secrets

parser=argparse.ArgumentParser()
parser.add_argument("--demo",action="store_true",help="Create author + coder01..coder10 and reference fixtures")
args=parser.parse_args()
path=Path(__file__).resolve().parents[1]/".env"
if path.exists():
    print(".env already exists; preserved without changes.")
    raise SystemExit(0)
admin=secrets.token_urlsafe(18)
demo=secrets.token_urlsafe(15) if args.demo else ""
path.write_text("\n".join([
    "PORT=8080","DB_PASSWORD="+secrets.token_urlsafe(24),
    "MYSQL_ROOT_PASSWORD="+secrets.token_urlsafe(24),
    "ADMIN_PASSWORD="+admin,"WORKER_TOKEN="+secrets.token_hex(32),
    "DEMO_DATA="+str(args.demo).lower(),"DEMO_PASSWORD="+demo,
    "APP_ORIGINS=http://localhost:8080,http://127.0.0.1:8080",""]),encoding="utf-8")
path.chmod(0o600)
print("Created .env. Admin username: admin")
print("Admin password:",admin)
if args.demo:
    print("Demo usernames: author, coder01 .. coder10")
    print("Demo password:",demo)
print("Keep .env private; do not include it in submissions.")
