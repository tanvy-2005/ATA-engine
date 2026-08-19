import json
import urllib.request

def test_planner():
    url = "http://127.0.0.1:8000/api/agents/planner"
    headers = {"Content-Type": "application/json"}
    
    # Test payload
    data = {
        "project_name": "AI testing platform",
        "description": "An automated testing platform using python FastAPI.",
        "tech_stack": ["python", "fastapi"],
        "target_url": "https://example.com"
    }
    
    req = urllib.request.Request(
        url, 
        data=json.dumps(data).encode("utf-8"), 
        headers=headers, 
        method="POST"
    )
    
    print("Sending request to Planner Agent...")
    try:
        with urllib.request.urlopen(req) as response:
            response_data = json.loads(response.read().decode("utf-8"))
            print("\nResponse Status Code: 200")
            print("Planner Agent Output Strategy:")
            print(json.dumps(response_data, indent=2))
    except Exception as e:
        print(f"Error calling Planner Agent: {e}")

if __name__ == "__main__":
    test_planner()
