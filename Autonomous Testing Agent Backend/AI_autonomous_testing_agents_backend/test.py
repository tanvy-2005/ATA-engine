import requests
import json

base_url = 'http://localhost:8000/api/v1'

def test_workspace_creation():
    # Login
    print("Logging in...")
    login_data = {
        'email': 'test@example.com',
        'password': 'password123'
    }
    res = requests.post(f"{base_url}/auth/login", json=login_data)
    
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        return
        
    token = res.json().get('token')
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    print("Creating workspace...")
    ws_data = {
        'name': 'Test Workspace',
        'slug': 'test-workspace',
        'description': 'A test workspace',
        'settings': {}
    }
    res = requests.post(f"{base_url}/workspaces", headers=headers, json=ws_data)
    
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")

if __name__ == "__main__":
    test_workspace_creation()
