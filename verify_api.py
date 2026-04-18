import requests
import time
import sys

BASE_URL = "http://localhost:8000/api/v1"

def wait_for_api():
    print("Waiting for FastAPI server to start...")
    for _ in range(30):
        try:
            r = requests.get("http://localhost:8000/")
            if r.status_code == 200:
                print("FastAPI is up!")
                return
        except requests.ConnectionError:
            pass
        time.sleep(1)
    print("Failed to connect to FastAPI.")
    sys.exit(1)

def run_tests():
    # 1. Register User
    print("Testing User Registration...")
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "secretpassword"
    }
    r = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    
    # Ignore if already exists (for rerunability)
    if r.status_code not in (200, 400):
        print(f"Registration failed: {r.status_code} {r.text}")
        sys.exit(1)

    # 2. Login User
    print("Testing User Login...")
    login_data = {"username": "testuser", "password": "secretpassword"}
    r = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if r.status_code != 200:
        print(f"Login failed: {r.status_code} {r.text}")
        sys.exit(1)
    
    token = r.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create Annotation
    print("Testing Create Annotation...")
    ann_data = {
        "url": "http://example.com",
        "text_selector": "test-selector",
        "selected_text": "This is important text",
        "initial_comment": "My thoughts on this text."
    }
    r = requests.post(f"{BASE_URL}/annotations", json=ann_data, headers=headers)
    if r.status_code != 200:
        print(f"Annotation creation failed: {r.status_code} {r.text}")
        sys.exit(1)
    
    # 4. Fetch Annotations
    print("Testing Fetch Annotations...")
    r = requests.get(f"{BASE_URL}/annotations?url=http://example.com")
    if r.status_code != 200:
        print(f"Fetch annotations failed: {r.status_code} {r.text}")
        sys.exit(1)
    
    annotations = r.json()
    if len(annotations) == 0:
        print("No annotations returned.")
        sys.exit(1)
        
    parent_comment_id = annotations[0]['comments'][0]['id']

    # 5. Reply to Comment
    print("Testing Threaded Replies...")
    reply_data = {"content": "I agree completely."}
    r = requests.post(f"{BASE_URL}/comments/{parent_comment_id}/reply", json=reply_data, headers=headers)
    if r.status_code != 200:
        print(f"Comment reply failed: {r.status_code} {r.text}")
        sys.exit(1)
        
    print("\n✅ All End-to-End API tests passed successfully!")

if __name__ == "__main__":
    wait_for_api()
    run_tests()
