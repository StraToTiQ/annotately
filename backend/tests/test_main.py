from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to AnotationBlog API"}

def test_404_not_found():
    response = client.get("/non-existent-endpoint")
    assert response.status_code == 404
    assert response.json() == {"detail": "Not Found"}
