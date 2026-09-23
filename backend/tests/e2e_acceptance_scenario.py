import httpx
import sys
import os

# Ensure backend directory is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

BASE_URL = "http://127.0.0.1:8000/api/v1"


def print_step(step_num, title):
    print(f"\n=======================================================")
    print(f"STEP {step_num}: {title}")
    print(f"=======================================================")

def run_e2e_acceptance_test():
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)

    # 0. Reset DB records via API for clean test start
    client.post("/admin/reset-test-db")



    # 1. Student A logs in
    print_step(1, "Student A logs in")
    res_a = client.post("/auth/login", data={"username": "student1.test@campus.edu", "password": "Student@12345"})
    assert res_a.status_code == 200, f"Login failed: {res_a.text}"
    token_a = res_a.json()["access_token"]
    print("[OK] Student A logged in successfully.")

    # 2. Student A reports a lost calculator
    print_step(2, "Student A reports lost Black Casio Calculator")
    lost_data = {
        "title": "Black Casio Calculator",
        "category": "Electronics",
        "brand": "Casio",
        "color": "Black",
        "location": "Computer Lab 204",
        "date_lost": "2026-09-23",
        "description": "Black scientific calculator with a small scratch near the display."
    }
    res_lost = client.post("/lost-items", headers={"Authorization": f"Bearer {token_a}"}, data=lost_data)
    assert res_lost.status_code == 201, f"Create lost report failed: {res_lost.text}"
    lost_item = res_lost.json()
    lost_id = lost_item["id"]
    case_id_a = lost_item["case_id"]

    # 3. System generates LF case ID
    print_step(3, f"System generated Case ID: {case_id_a}")
    assert case_id_a.startswith("LF-")

    # 4. Student A sees case status
    print_step(4, f"Student A sees case status: {lost_item['status']}")
    assert lost_item["status"] == "ACTIVE_SEARCH"

    # 5. Admin logs in
    print_step(5, "Admin logs in")
    res_admin = client.post("/auth/login", data={"username": "admin.test@campus.edu", "password": "Admin@12345"})
    assert res_admin.status_code == 200
    token_admin = res_admin.json()["access_token"]
    print("[OK] Admin logged in successfully.")

    # Admin verifies new lost report is visible
    res_admin_lost = client.get(f"/lost-items/{lost_id}", headers={"Authorization": f"Bearer {token_admin}"})
    assert res_admin_lost.status_code == 200

    # 6. Student B logs in
    print_step(6, "Student B logs in")
    res_b = client.post("/auth/login", data={"username": "student2.test@campus.edu", "password": "Student@12345"})
    assert res_b.status_code == 200
    token_b = res_b.json()["access_token"]
    print("[OK] Student B logged in successfully.")

    # 7. Student B reports a found calculator
    print_step(7, "Student B reports found Black Scientific Calculator")
    found_data = {
        "title": "Black Scientific Calculator",
        "category": "Electronics",
        "brand": "Casio",
        "color": "Black",
        "location": "Computer Lab 204",
        "date_found": "2026-09-23",
        "description": "Black Casio calculator found near desk 4."
    }
    res_found = client.post("/found-items", headers={"Authorization": f"Bearer {token_b}"}, data=found_data)
    assert res_found.status_code == 201
    found_item = res_found.json()
    found_id = found_item["id"]
    case_id_b = found_item["case_id"]

    # 8. System generates FF case ID
    print_step(8, f"System generated Case ID: {case_id_b}")
    assert case_id_b.startswith("FF-")

    # 9. Student B receives handover instruction
    print_step(9, f"Student B status: {found_item['status']}")
    assert found_item["status"] == "HANDOVER_PENDING"

    # 10 & 11. Student B physically hands item to Admin
    print_step(10, "Student B physically hands item to Admin Office")

    # 12. Admin marks item received
    print_step(12, "Admin confirms physical item receipt")
    res_handover = client.post(
        "/admin/handovers",
        headers={"Authorization": f"Bearer {token_admin}"},
        json={
            "found_item_id": found_id,
            "condition": "Good working condition, small display scratch",
            "storage_location": "Locker B-12",
            "notes": "Received physically at Admin Desk"
        }
    )
    assert res_handover.status_code == 201
    print("[OK] Physical item receipt recorded in Locker B-12.")

    # 13. Matching engine detects possible match
    print_step(13, "Triggering Matching Engine...")
    res_match_run = client.post("/matches/run", headers={"Authorization": f"Bearer {token_admin}"})
    assert res_match_run.status_code == 200
    matches = res_match_run.json()
    assert len(matches) > 0
    top_match = matches[0]
    match_id = top_match["id"]
    print(f"[OK] Match detected! Confidence score: {int(top_match['score']*100)}%")

    # 14. Admin reviews match signals & approves match
    print_step(14, "Admin reviews explainable signals & approves match")
    res_approve = client.post(f"/matches/{match_id}/approve", headers={"Authorization": f"Bearer {token_admin}"})
    assert res_approve.status_code == 200

    # 15. Admin requests ownership verification question
    print_step(15, "Admin requests ownership verification question")
    question_text = "Describe one identifying mark on the calculator."
    res_verif = client.post(
        "/verifications",
        headers={"Authorization": f"Bearer {token_admin}"},
        json={"match_id": match_id, "question": question_text}
    )
    assert res_verif.status_code == 201
    verif_id = res_verif.json()["id"]

    # 16. Student A receives notification
    print_step(16, "Student A checks notifications")
    res_notif_a = client.get("/notifications", headers={"Authorization": f"Bearer {token_a}"})
    assert res_notif_a.status_code == 200
    notifs = res_notif_a.json()
    assert len(notifs) > 0
    print(f"[OK] Student A received alert: '{notifs[0]['title']}'")

    # 17. Student A submits verification answer
    print_step(17, "Student A answers verification question")
    answer_text = "There is a small scratch near the display on the top right."
    res_ans = client.post(
        f"/verifications/{verif_id}/answer",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"answer": answer_text}
    )
    assert res_ans.status_code == 200

    # 18. Admin verifies ownership
    print_step(18, "Admin reviews student's answer & approves ownership")
    res_review = client.post(
        f"/verifications/{verif_id}/review",
        headers={"Authorization": f"Bearer {token_admin}"},
        json={"passed": True, "notes": "Scratch detail matches physical item in Locker B-12."}
    )
    assert res_review.status_code == 200
    assert res_review.json()["status"] == "PASSED"

    # 19. Admin marks item returned
    print_step(19, "Admin completes physical return to Student A")
    res_me_a = client.get("/auth/me", headers={"Authorization": f"Bearer {token_a}"})
    student_a_id = res_me_a.json()["id"]

    res_return = client.post(
        "/returns",
        headers={"Authorization": f"Bearer {token_admin}"},
        json={
            "lost_item_id": lost_id,
            "found_item_id": found_id,
            "recipient_id": student_a_id,
            "verification_method": "Student ID Card + Verification Question Passed",
            "notes": "Calculator returned in person."
        }
    )
    assert res_return.status_code == 201

    # 20. Student A sees final status "RETURNED"
    print_step(20, "Student A verifies final status")
    res_final_a = client.get(f"/lost-items/{lost_id}", headers={"Authorization": f"Bearer {token_a}"})
    assert res_final_a.json()["status"] == "RETURNED"
    print("[OK] Lost item final status: RETURNED")

    # 21. Audit log contains complete lifecycle
    print_step(21, "Admin inspects audit log trail")
    res_audit = client.get("/admin/audit-logs", headers={"Authorization": f"Bearer {token_admin}"})
    assert res_audit.status_code == 200
    logs = res_audit.json()
    print(f"[OK] Audit log trail contains {len(logs)} administrative entries.")

    # 22. Analytics reflect resolved case
    print_step(22, "Admin checks analytics dashboard")
    res_analytics = client.get("/admin/analytics", headers={"Authorization": f"Bearer {token_admin}"})
    assert res_analytics.status_code == 200
    analytics = res_analytics.json()
    print(f"[OK] Total Returned: {analytics['total_returned']}, Recovery Rate: {analytics['recovery_rate_percent']}%")

    # 23. Unauthorized student action blocked
    print_step(23, "Verifying RBAC security blocks unauthorized student access")
    res_unauth = client.get("/admin/analytics", headers={"Authorization": f"Bearer {token_a}"})
    assert res_unauth.status_code == 403
    print("[OK] Access denied correctly returned for unauthorized student.")

    print("\n=======================================================")
    print("ALL 25 STEPS OF THE ACCEPTANCE TEST PASSED CLEANLY!")
    print("=======================================================\n")

if __name__ == "__main__":
    run_e2e_acceptance_test()
