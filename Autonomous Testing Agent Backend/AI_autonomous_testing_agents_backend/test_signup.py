import urllib.request
import json
import urllib.error

data = json.dumps({
    "name": "Test User",
    "email": "test@example.com",
    "password": "Password123!"
}).encode('utf-8')

req = urllib.request.Request("http://127.0.0.1:8000/api/v1/auth/signup", data=data, headers={'Content-Type': 'application/json'})

try:
    response = urllib.request.urlopen(req)
    print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode('utf-8'))
