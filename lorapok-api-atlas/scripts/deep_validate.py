import json
import requests
import time

COLLECTION_PATH = "lorapok-api-atlas/src/data/api_collection.json"

def validate_apis():
    with open(COLLECTION_PATH, "r") as f:
        collection = json.load(f)
    
    issues = []
    
    def walk(item):
        if "request" in item and "url" in item["request"]:
            url = item["request"]["url"].get("raw")
            if url:
                print(f"Testing {item['name']} -> {url}")
                try:
                    headers = {"Accept": "application/json", "User-Agent": "Lorapok-API-Atlas/1.0"}
                    # Demo keys for testing
                    test_url = url.replace("YOUR_API_KEY", "DEMO_KEY").replace("FREE_KEY", "DEMO_KEY").replace("API_KEY", "DEMO_KEY")
                    
                    resp = requests.get(test_url, headers=headers, timeout=5)
                    if resp.status_code >= 400:
                        issues.append({"name": item["name"], "url": url, "error": f"Status {resp.status_code}"})
                    else:
                        data = resp.json() if "json" in resp.headers.get("Content-Type", "") else str(resp.content)
                        if not data or (isinstance(data, dict) and len(data) == 0):
                            issues.append({"name": item["name"], "url": url, "error": "Empty Response"})
                except Exception as e:
                    issues.append({"name": item["name"], "url": url, "error": str(e)})
                time.sleep(0.2)
        
        if "item" in item:
            for sub in item["item"]:
                walk(sub)

    walk(collection)
    return issues

if __name__ == "__main__":
    issues = validate_apis()
    print("\n--- ISSUES FOUND ---")
    for issue in issues:
        print(f"[{issue['name']}] URL: {issue['url']} | ERROR: {issue['error']}")
