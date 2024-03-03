import secrets

secret_key = secrets.token_urlsafe(32)  # Generates a 256-bit secret key
print(secret_key)
