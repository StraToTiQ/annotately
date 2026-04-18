def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"username": "testuser", "email": "test@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert "id" in data

def test_register_duplicate_user(client):
    client.post(
        "/api/v1/auth/register",
        json={"username": "testuser", "email": "test@example.com", "password": "password123"}
    )
    response = client.post(
        "/api/v1/auth/register",
        json={"username": "testuser", "email": "other@example.com", "password": "password123"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Username already registered"

def test_pydantic_validation_invalid_email(client):
    # Tests Pydantic email validation
    response = client.post(
        "/api/v1/auth/register",
        json={"username": "testuser", "email": "not-an-email", "password": "password123"}
    )
    assert response.status_code == 422 # Unprocessable Entity
    
def test_login_user(client):
    client.post(
        "/api/v1/auth/register",
        json={"username": "testuser", "email": "test@example.com", "password": "password123"}
    )
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser", "password": "password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_create_and_get_annotation(client):
    # Register and login to get token
    client.post(
        "/api/v1/auth/register",
        json={"username": "testuser", "email": "test@example.com", "password": "password123"}
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser", "password": "password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Annotation
    annotation_data = {
        "url": "http://example.com",
        "text_selector": "body > p",
        "selected_text": "This is a test highlight",
        "initial_comment": "This is my comment"
    }
    create_resp = client.post("/api/v1/annotations", json=annotation_data, headers=headers)
    assert create_resp.status_code == 200
    created = create_resp.json()
    assert created["selected_text"] == "This is a test highlight"

    # Get Annotations
    get_resp = client.get("/api/v1/annotations?url=http://example.com")
    assert get_resp.status_code == 200
    annotations = get_resp.json()
    assert len(annotations) == 1
    assert annotations[0]["selected_text"] == "This is a test highlight"
    assert len(annotations[0]["comments"]) == 1
    assert annotations[0]["comments"][0]["content"] == "This is my comment"
