import os
import smtplib
from email.message import EmailMessage

"""
Teste de SMTP Zoho: tenta matriz de hosts/portas com STARTTLS (587) e SSL (465).
Lê EMAIL_HOST_USER, EMAIL_HOST_PASSWORD e TEST_TO do ambiente.
"""

# Vars principais (strip de quotes e whitespace)
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', 'novo.cadastro@controlesetup.com.br').strip().strip('"')
RAW_PWD = os.getenv('EMAIL_HOST_PASSWORD', 'MD389wy7F83y')
EMAIL_HOST_PASSWORD = RAW_PWD.strip().strip('"')
TEST_TO = os.getenv('TEST_TO', 'daniel.duarte@gruposetup.com.br').strip()

print('user=', EMAIL_HOST_USER)
print('pwd_len=', len(EMAIL_HOST_PASSWORD), 'pwd_repr=', repr(EMAIL_HOST_PASSWORD))
print('to=', TEST_TO)

def build_msg(subject: str) -> EmailMessage:
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = EMAIL_HOST_USER
    msg['To'] = TEST_TO
    msg.set_content(subject)
    return msg

def try_starttls(host: str, port: int = 587):
    with smtplib.SMTP(host, port, timeout=25) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()
        smtp.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
        smtp.send_message(build_msg(f'Teste STARTTLS {host}:{port}'))

def try_ssl(host: str, port: int = 465):
    with smtplib.SMTP_SSL(host, port, timeout=25) as smtp:
        smtp.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
        smtp.send_message(build_msg(f'Teste SSL {host}:{port}'))

def run_case(name: str, fn):
    print(f'\n=== {name} ===')
    try:
        fn()
        print('OK: email enviado')
    except Exception as e:
        print('ERRO:', repr(e))

cases = [
    ('smtp.zoho.com STARTTLS 587', lambda: try_starttls('smtp.zoho.com', 587)),
    ('smtp.zoho.com SSL 465',     lambda: try_ssl('smtp.zoho.com', 465)),
    ('smtp.zoho.eu STARTTLS 587', lambda: try_starttls('smtp.zoho.eu', 587)),
    ('smtp.zoho.eu SSL 465',      lambda: try_ssl('smtp.zoho.eu', 465)),
]

for name, fn in cases:
    run_case(name, fn)
