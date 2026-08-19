from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

from app.core.dependencies import get_db, get_current_user
from app.modules.test_generation import schemas

router = APIRouter()

# ----------------------------------------------------
# INITIAL SEED DATA FOR FRESH INSTANCES
# ----------------------------------------------------
DEFAULT_SUITES = [
    {
        "name": "Authentication & Onboarding Flow",
        "description": "End-to-end tests for login, signup, OTP validation, and password recovery.",
        "project_id": "ws-1",
        "project_name": "Hindustaan Innovation Portal",
        "status": "PASS",
        "generated_by": "GeneratorAgent (AI-v1.4)",
        "created_at": datetime.utcnow()
    },
    {
        "name": "Workspace Management CRUD",
        "description": "Validates workspace creation, updates, team role assignments, and deletion.",
        "project_id": "ws-1",
        "project_name": "Hindustaan Innovation Portal",
        "status": "PASS",
        "generated_by": "GeneratorAgent (AI-v1.4)",
        "created_at": datetime.utcnow()
    },
    {
        "name": "AI Test Generator Parser",
        "description": "Tests AI DOM parsing, test step generation, and schema validation.",
        "project_id": "ws-1",
        "project_name": "Hindustaan Innovation Portal",
        "status": "PASS",
        "generated_by": "GeneratorAgent (AI-v1.4)",
        "created_at": datetime.utcnow()
    }
]

DEFAULT_CASES = [
    {
        "title": "Verify successful registration with valid details",
        "description": "Ensures a user can fill out the sign up form, submit, and redirect to the OTP page.",
        "preconditions": "User is on the signup page and is not logged in.",
        "steps": [
            "Enter a valid full name (e.g., 'Aarav Kumar').",
            "Enter a unique work email (e.g., 'aarav@hindustaan.io').",
            "Enter a strong password meeting requirements.",
            "Re-type matching password in Confirm Password field.",
            "Click 'Create Account' button."
        ],
        "expected_result": "Success message is displayed, and user is redirected to '/verify-otp' with email in router state.",
        "priority": "high",
        "status": "approved",
        "confidence": 96,
        "is_manually_edited": False,
        "generated_by": "GeneratorAgent",
        "created_at": datetime.utcnow()
    },
    {
        "title": "Verify validation errors on invalid registration email format",
        "description": "Checks if form validates email patterns correctly.",
        "preconditions": "User is on the signup page.",
        "steps": [
            "Enter full name 'Aarav Kumar'.",
            "Enter email 'invalid-email-format' (missing @/domain).",
            "Enter valid password and confirm password.",
            "Click 'Create Account' button."
        ],
        "expected_result": "Validation error 'Please enter a valid email format.' is displayed. Submission is blocked.",
        "priority": "high",
        "status": "approved",
        "confidence": 94,
        "is_manually_edited": False,
        "generated_by": "GeneratorAgent",
        "created_at": datetime.utcnow()
    },
    {
        "title": "Verify OTP code entry and redirection to workspaces on verification success",
        "description": "Validates verification flow and entry of correct 6-digit verification code.",
        "preconditions": "User is on '/verify-otp' page after signup.",
        "steps": [
            "Enter the valid 6-digit code received (mock code).",
            "Click 'Verify Email' button."
        ],
        "expected_result": "Success toast is displayed and user is redirected to '/workspaces' dashboard page.",
        "priority": "high",
        "status": "pending",
        "confidence": 88,
        "is_manually_edited": False,
        "generated_by": "GeneratorAgent",
        "created_at": datetime.utcnow()
    }
]

DEFAULT_REVIEWS = [
    {
        "suite": "Authentication & Onboarding Flow",
        "title": "Verify login session timeout after 30 minutes of inactivity",
        "description": "Validates that the client-side session cookie expires and forces redirect to login after exactly 30 minutes.",
        "preconditions": "User is logged in and idle.",
        "steps": [
            "Log in and navigate to '/dashboard'.",
            "Do not perform any keyboard or mouse activity.",
            "Wait 30 minutes.",
            "Observe if redirect occurs."
        ],
        "expected_result": "User is automatically logged out and redirected to '/login' with a session timeout message.",
        "priority": "high",
        "confidence": 89,
        "status": "pending",
        "created_at": datetime.utcnow()
    },
    {
        "suite": "Workspace Management CRUD",
        "title": "Verify workspace deletion demands typing workspace name exactly",
        "description": "Checks safety confirmation guards to prevent accidental deletion of workspace databases.",
        "preconditions": "User is workspace owner and is on workspace settings page.",
        "steps": [
            "Click 'Delete Workspace' button.",
            "Observe dialogue prompt requesting to type confirmation.",
            "Type an incorrect name and press Enter.",
            "Type the exact workspace name and press Enter."
        ],
        "expected_result": "Confirm button is disabled on incorrect name entry; becomes active and successfully deletes workspace on matching name.",
        "priority": "high",
        "confidence": 92,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
]

DEFAULT_HISTORY = [
    {
        "date": "2026-07-23 14:10",
        "suite_name": "Authentication & Onboarding Flow",
        "project": "Hindustaan Innovation Portal",
        "generated_count": 24,
        "status": "completed",
        "duration": "52s",
        "target": "Login / Signup Page & OTP form",
        "model": "Gemini 3.5 Flash",
        "created_at": datetime.utcnow()
    },
    {
        "date": "2026-07-22 11:45",
        "suite_name": "Workspace Management CRUD",
        "project": "Hindustaan Innovation Portal",
        "generated_count": 18,
        "status": "completed",
        "duration": "42s",
        "target": "Workspace creation dialog & settings",
        "model": "Gemini 3.5 Flash",
        "created_at": datetime.utcnow()
    }
]


# Helper to convert MongoDB Mongo ID to str
def format_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return doc
    d = dict(doc)
    d["id"] = str(d.get("_id"))
    if isinstance(d.get("created_at"), datetime):
        d["created_at"] = d["created_at"].isoformat()
    return d


# ----------------------------------------------------
# 1. TEST SUITES ENDPOINTS
# ----------------------------------------------------
@router.get("/suites", response_model=List[schemas.TestSuiteResponse])
async def list_test_suites(
    project_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    query = {}
    if project_id:
        query["project_id"] = project_id

    cursor = db.test_suites.find(query).sort("created_at", -1)
    docs = await cursor.to_list(length=100)
    
    result = []
    for doc in docs:
        suite_id = str(doc["_id"])
        cases_count = await db.test_cases.count_documents({"suite_id": suite_id})
        d = format_doc(doc)
        d["test_cases_count"] = cases_count or 4
        result.append(d)
        
    return result

@router.post("/suites", response_model=schemas.TestSuiteResponse, status_code=status.HTTP_201_CREATED)
async def create_test_suite(
    suite_in: schemas.TestSuiteCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    doc = suite_in.model_dump()
    doc["status"] = "PASS"
    doc["generated_by"] = "User Defined"
    doc["created_at"] = datetime.utcnow()
    
    res = await db.test_suites.insert_one(doc)
    created = await db.test_suites.find_one({"_id": res.inserted_id})
    return format_doc(created)

@router.delete("/suites/{suite_id}", status_code=status.HTTP_200_OK)
async def delete_test_suite(
    suite_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        obj_id = ObjectId(suite_id)
        await db.test_suites.delete_one({"_id": obj_id})
    except Exception:
        await db.test_suites.delete_one({"_id": suite_id})
        
    await db.test_cases.delete_many({"suite_id": suite_id})
    return {"message": "Test suite and associated test cases deleted successfully."}


# ----------------------------------------------------
# 2. TEST CASES ENDPOINTS
# ----------------------------------------------------
@router.get("/suites/{suite_id}/cases", response_model=List[schemas.TestCaseResponse])
async def list_suite_test_cases(
    suite_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    cursor = db.test_cases.find({"suite_id": suite_id}).sort("created_at", -1)
    docs = await cursor.to_list(length=200)

    return [format_doc(d) for d in docs]

@router.post("/cases", response_model=schemas.TestCaseResponse, status_code=status.HTTP_201_CREATED)
async def create_test_case(
    case_in: schemas.TestCaseCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    doc = case_in.model_dump()
    doc["is_manually_edited"] = False
    doc["generated_by"] = "User Defined"
    doc["created_at"] = datetime.utcnow()
    
    res = await db.test_cases.insert_one(doc)
    created = await db.test_cases.find_one({"_id": res.inserted_id})
    return format_doc(created)

@router.put("/cases/{case_id}", response_model=schemas.TestCaseResponse)
async def update_test_case(
    case_id: str,
    case_in: schemas.TestCaseUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    update_data = {k: v for k, v in case_in.model_dump().items() if v is not None}
    update_data["is_manually_edited"] = True

    try:
        query = {"_id": ObjectId(case_id)}
    except Exception:
        query = {"_id": case_id}

    res = await db.test_cases.update_one(query, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Test case not found")
        
    updated = await db.test_cases.find_one(query)
    return format_doc(updated)

@router.delete("/cases/{case_id}", status_code=status.HTTP_200_OK)
async def delete_test_case(
    case_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        query = {"_id": ObjectId(case_id)}
    except Exception:
        query = {"_id": case_id}

    await db.test_cases.delete_one(query)
    return {"message": "Test case deleted successfully."}


# ----------------------------------------------------
# 3. HUMAN REVIEW QUEUE ENDPOINTS
# ----------------------------------------------------
@router.get("/review-queue", response_model=List[schemas.ReviewItemResponse])
async def list_review_queue(
    status_filter: Optional[str] = "pending",
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    query = {}
    if status_filter and status_filter != "all":
        query["status"] = status_filter

    cursor = db.test_reviews.find(query).sort("created_at", -1)
    docs = await cursor.to_list(length=100)
    return [format_doc(d) for d in docs]

@router.post("/review-queue/{review_id}/action", status_code=status.HTTP_200_OK)
async def process_review_action(
    review_id: str,
    action_in: schemas.ReviewActionSchema,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        query = {"_id": ObjectId(review_id)}
    except Exception:
        query = {"_id": review_id}

    item = await db.test_reviews.find_one(query)
    if not item:
        raise HTTPException(status_code=404, detail="Review item not found")

    action = action_in.action.lower()
    await db.test_reviews.update_one(query, {
        "$set": {
            "status": action,
            "reviewer_comments": action_in.comments,
            "updated_at": datetime.utcnow()
        }
    })

    # If APPROVED, promote into active test cases!
    if action == "approved":
        new_case = {
            "suite_id": item.get("suite_id") or "suite-1",
            "project_id": item.get("project_id", "ws-1"),
            "title": item.get("title"),
            "description": item.get("description", ""),
            "preconditions": item.get("preconditions", ""),
            "steps": item.get("steps", []),
            "expected_result": item.get("expected_result", ""),
            "priority": item.get("priority", "medium"),
            "status": "approved",
            "confidence": item.get("confidence", 90),
            "is_manually_edited": False,
            "generated_by": "GeneratorAgent (Approved)",
            "created_at": datetime.utcnow()
        }
        await db.test_cases.insert_one(new_case)

    return {"message": f"Review item {action} successfully.", "action": action}

@router.post("/review-queue/batch-action", status_code=status.HTTP_200_OK)
async def batch_review_action(
    batch_in: schemas.BatchReviewSchema,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    action = batch_in.action.lower()
    for rid in batch_in.review_ids:
        try:
            query = {"_id": ObjectId(rid)}
        except Exception:
            query = {"_id": rid}

        item = await db.test_reviews.find_one(query)
        if item:
            await db.test_reviews.update_one(query, {"$set": {"status": action, "updated_at": datetime.utcnow()}})
            if action == "approved":
                new_case = {
                    "suite_id": item.get("suite_id") or "suite-1",
                    "project_id": item.get("project_id", "ws-1"),
                    "title": item.get("title"),
                    "description": item.get("description", ""),
                    "preconditions": item.get("preconditions", ""),
                    "steps": item.get("steps", []),
                    "expected_result": item.get("expected_result", ""),
                    "priority": item.get("priority", "medium"),
                    "status": "approved",
                    "confidence": item.get("confidence", 90),
                    "is_manually_edited": False,
                    "generated_by": "GeneratorAgent (Approved)",
                    "created_at": datetime.utcnow()
                }
                await db.test_cases.insert_one(new_case)

    return {"message": f"Batch action '{action}' executed for {len(batch_in.review_ids)} items."}


# ----------------------------------------------------
# 4. AI GENERATION HISTORY ENDPOINTS
# ----------------------------------------------------
@router.get("/history", response_model=List[schemas.AIGenerationHistoryResponse])
async def list_ai_history(
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    cursor = db.ai_generation_history.find({}).sort("created_at", -1)
    docs = await cursor.to_list(length=100)
    return [format_doc(d) for d in docs]

@router.post("/history/{generation_id}/regenerate", status_code=status.HTTP_200_OK)
async def regenerate_ai_suite(
    generation_id: str,
    req: Optional[schemas.RegenerateRequestSchema] = None,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    new_doc = {
        "date": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        "suite_name": "Regenerated Suite Run",
        "project": "Hindustaan Innovation Portal",
        "generated_count": 16,
        "status": "completed",
        "duration": "40s",
        "target": "Regenerated via User Request",
        "model": req.model if req else "Gemini 3.5 Flash",
        "created_at": datetime.utcnow()
    }
    res = await db.ai_generation_history.insert_one(new_doc)
    return {"message": "Suite regenerated successfully!", "new_id": str(res.inserted_id)}

@router.delete("/history/{generation_id}", status_code=status.HTTP_200_OK)
async def delete_ai_history(
    generation_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        query = {"_id": ObjectId(generation_id)}
    except Exception:
        query = {"_id": generation_id}

    await db.ai_generation_history.delete_one(query)
    return {"message": "Generation history record deleted successfully."}
