import pytest
from app.models import LostItemStatus, FoundItemStatus, MatchStatus, VerificationStatus

def get_token(client, email, password):
    res = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password}
    )
    assert res.status_code == 200
    return res.json()["access_token"]

def test_auth_flows(client):
    # Test correct login
    token_admin = get_token(client, "admin.test@campus.edu", "Admin@12345")
    assert token_admin is not None

    # Test incorrect password
    res = client.post("/api/v1/auth/login", data={"username": "admin.test@campus.edu", "password": "WrongPassword"})
    assert res.status_code == 401

    # Test student registration with standard email syntax
    reg_res = client.post("/api/v1/auth/register", json={
        "email": "newstudent@campus.edu",
        "password": "Password123",
        "full_name": "New Student",
        "roll_number": "2026-CS-999",
        "department": "Computer Science",
        "phone": "+1-555-9999",
        "role": "STUDENT"
    })
    assert reg_res.status_code == 201
    assert reg_res.json()["email"] == "newstudent@campus.edu"

def test_full_lost_found_lifecycle(client):
    token_student_a = get_token(client, "student1.test@campus.edu", "Student@12345")
    token_student_b = get_token(client, "student2.test@campus.edu", "Student@12345")
    token_admin = get_token(client, "admin.test@campus.edu", "Admin@12345")


    # 1. Student A reports Lost Item
    lost_res = client.post(
        "/api/v1/lost-items",
        headers={"Authorization": f"Bearer {token_student_a}"},
        data={
            "title": "Black Casio Calculator",
            "category": "Electronics",
            "brand": "Casio",
            "color": "Black",
            "location": "Computer Lab 204",
            "date_lost": "2026-09-23",
            "description": "Black scientific calculator with a small scratch near the display."
        }
    )
    assert lost_res.status_code == 201
    lost_data = lost_res.json()
    assert lost_data["case_id"].startswith("LF-")
    assert lost_data["status"] == "ACTIVE_SEARCH"
    lost_item_id = lost_data["id"]

    # 2. Student B reports Found Item
    found_res = client.post(
        "/api/v1/found-items",
        headers={"Authorization": f"Bearer {token_student_b}"},
        data={
            "title": "Black Scientific Calculator",
            "category": "Electronics",
            "brand": "Casio",
            "color": "Black",
            "location": "Computer Lab 204",
            "date_found": "2026-09-23",
            "description": "Black Casio calculator found near the desk."
        }
    )
    assert found_res.status_code == 201
    found_data = found_res.json()
    assert found_data["case_id"].startswith("FF-")
    assert found_data["status"] == "HANDOVER_PENDING"
    found_item_id = found_data["id"]

    # 3. Admin records physical handover receipt
    handover_res = client.post(
        "/api/v1/admin/handovers",
        headers={"Authorization": f"Bearer {token_admin}"},
        json={
            "found_item_id": found_item_id,
            "condition": "Good working condition, scratch on display",
            "storage_location": "Locker B-12",
            "notes": "Handed over by Student B at front desk"
        }
    )
    assert handover_res.status_code == 201
    assert handover_res.json()["storage_location"] == "Locker B-12"

    # Verify found item status updated (RECEIVED_BY_ADMIN or POSSIBLE_MATCH if auto matched)
    f_check = client.get(f"/api/v1/found-items/{found_item_id}", headers={"Authorization": f"Bearer {token_admin}"})
    assert f_check.json()["status"] in ["RECEIVED_BY_ADMIN", "POSSIBLE_MATCH"]

    # 4. Trigger Matching Engine & verify match score
    match_run = client.post("/api/v1/matches/run", headers={"Authorization": f"Bearer {token_admin}"})
    assert match_run.status_code == 200
    matches = match_run.json()
    assert len(matches) > 0
    top_match = matches[0]
    assert top_match["score"] >= 0.70
    assert "description" in top_match["signals_json"]
    match_id = top_match["id"]

    # Approve match
    app_res = client.post(f"/api/v1/matches/{match_id}/approve", headers={"Authorization": f"Bearer {token_admin}"})
    assert app_res.status_code == 200

    # 5. Admin requests Ownership Verification
    verif_res = client.post(
        "/api/v1/verifications",
        headers={"Authorization": f"Bearer {token_admin}"},
        json={
            "match_id": match_id,
            "question": "Describe one identifying mark on the calculator."
        }
    )
    assert verif_res.status_code == 201
    verif_id = verif_res.json()["id"]

    # 6. Student A submits answer
    ans_res = client.post(
        f"/api/v1/verifications/{verif_id}/answer",
        headers={"Authorization": f"Bearer {token_student_a}"},
        json={"answer": "There is a small scratch near the top right of the LCD display screen."}
    )
    assert ans_res.status_code == 200
    assert ans_res.json()["status"] == "SUBMITTED"

    # 7. Admin reviews & passes verification
    review_res = client.post(
        f"/api/v1/verifications/{verif_id}/review",
        headers={"Authorization": f"Bearer {token_admin}"},
        json={"passed": True, "notes": "Scratch detail matches physical item in Locker B-12."}
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "PASSED"

    # 8. Admin completes Return
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token_student_a}"})
    student_a_id = me_res.json()["id"]

    return_res = client.post(
        "/api/v1/returns",
        headers={"Authorization": f"Bearer {token_admin}"},
        json={
            "lost_item_id": lost_item_id,
            "found_item_id": found_item_id,
            "recipient_id": student_a_id,
            "verification_method": "ID Card + Ownership verification question passed",
            "notes": "Calculator handed over in person."
        }
    )
    assert return_res.status_code == 201

    # Verify final statuses are RETURNED
    l_final = client.get(f"/api/v1/lost-items/{lost_item_id}", headers={"Authorization": f"Bearer {token_student_a}"})
    assert l_final.json()["status"] == "RETURNED"

    # 9. Verify Audit logs recorded
    audit_res = client.get("/api/v1/admin/audit-logs", headers={"Authorization": f"Bearer {token_admin}"})
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) >= 5

def test_rbacs_security(client):
    token_student = get_token(client, "student1.test@campus.edu", "Student@12345")

    
    # Student cannot access admin handover endpoint
    res1 = client.post(
        "/api/v1/admin/handovers",
        headers={"Authorization": f"Bearer {token_student}"},
        json={"found_item_id": 1, "condition": "Good", "storage_location": "Locker"}
    )
    assert res1.status_code == 403

    # Student cannot access admin analytics
    res2 = client.get("/api/v1/admin/analytics", headers={"Authorization": f"Bearer {token_student}"})
    assert res2.status_code == 403
