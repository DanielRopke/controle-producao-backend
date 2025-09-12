import smtplib
import socket
import os
from pathlib import Path
import json

def load_env(path):
    d = {}
    for line in Path(path).read_text(encoding='utf-8').splitlines():
        line=line.strip()
        if not line or line.startswith('#'):
            continue
        if '=' in line:
            k,v=line.split('=',1)
            d[k.strip()]=v.strip()
    return d

env = load_env(Path(__file__).resolve().parent.parent / 'VARIAVEISRENDER')

checks = {}

def try_smtp(prefix, host, port, user, pwd, use_tls):
    res = {'host': host, 'port': port, 'user': user, 'use_tls': use_tls}
    try:
        with smtplib.SMTP(host=host, port=int(port), timeout=10) as server:
            server.set_debuglevel(0)
            server.ehlo()
            if str(use_tls).lower() in ('1','true','yes'):
                server.starttls()
                server.ehlo()
            if user and pwd:
                try:
                    server.login(user, pwd)
                    res['ok'] = True
                except smtplib.SMTPAuthenticationError as e:
                    res['ok'] = False
                    res['error'] = f'Authentication failed: {e.smtp_error.decode() if isinstance(e.smtp_error, bytes) else e.smtp_error}'
                except Exception as e:
                    res['ok'] = False
                    res['error'] = f'Login error: {repr(e)}'
            else:
                res['ok'] = True
    except (socket.timeout, ConnectionRefusedError, socket.error) as e:
        res['ok'] = False
        res['error'] = f'Connection error: {repr(e)}'
    except Exception as e:
        res['ok'] = False
        res['error'] = repr(e)
    return res

# Default EMAIL_*
if env.get('EMAIL_HOST'):
    checks['default'] = try_smtp('default', env.get('EMAIL_HOST'), env.get('EMAIL_PORT', '587'), env.get('EMAIL_HOST_USER'), env.get('EMAIL_HOST_PASSWORD'), env.get('EMAIL_USE_TLS', 'true'))
else:
    checks['default'] = {'ok': False, 'note': 'EMAIL_HOST not set'}

# Recovery
if env.get('RECOVERY_EMAIL_HOST'):
    checks['recovery'] = try_smtp('recovery', env.get('RECOVERY_EMAIL_HOST'), env.get('RECOVERY_EMAIL_PORT', env.get('EMAIL_PORT','587')), env.get('RECOVERY_EMAIL_HOST_USER', env.get('EMAIL_HOST_USER')), env.get('RECOVERY_EMAIL_HOST_PASSWORD', env.get('EMAIL_HOST_PASSWORD')), env.get('RECOVERY_EMAIL_USE_TLS', env.get('EMAIL_USE_TLS','true')))
else:
    checks['recovery'] = {'ok': False, 'note': 'RECOVERY_EMAIL_HOST not set'}

print(json.dumps(checks, indent=2, ensure_ascii=False))
