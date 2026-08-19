from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from app.db.mongodb import db_client

router = APIRouter()

@router.get("/coverage-trend")
async def get_coverage_trend(days: int = 30):
    if db_client.db is None:
        raise HTTPException(status_code=503, detail="Database connection not available")
    try:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        pipeline = [
            {"$match": {"created_at": {"$gte": cutoff_date.isoformat()}}},
            {"$project": {
                "date": {"$substr": ["$created_at", 0, 10]},
                "total_tests": 1
            }},
            {"$group": {
                "_id": "$date",
                "tests_run": {"$sum": "$total_tests"}
            }},
            {"$sort": {"_id": 1}}
        ]
        cursor = db_client.db["runs"].aggregate(pipeline)
        results = await cursor.to_list(length=100)
        formatted = [{"date": r["_id"], "tests": r["tests_run"]} for r in results]
        return formatted
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/failure-heatmap")
async def get_failure_heatmap():
    if db_client.db is None:
        raise HTTPException(status_code=503, detail="Database connection not available")
    try:
        pipeline = [
            {"$match": {"status": "fail"}},
            {"$group": {
                "_id": "$project_name",
                "failures": {"$sum": 1}
            }},
            {"$sort": {"failures": -1}}
        ]
        cursor = db_client.db["test_cases"].aggregate(pipeline)
        results = await cursor.to_list(length=50)
        formatted = [{"component": r["_id"] or "Unknown", "failures": r["failures"]} for r in results]
        return formatted
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/flaky-tests")
async def get_flaky_tests():
    if db_client.db is None:
        raise HTTPException(status_code=503, detail="Database connection not available")
    try:
        pipeline = [
            {"$group": {
                "_id": "$title",
                "total_runs": {"$sum": 1},
                "passes": {"$sum": {"$cond": [{"$eq": ["$status", "pass"]}, 1, 0]}},
                "fails": {"$sum": {"$cond": [{"$eq": ["$status", "fail"]}, 1, 0]}}
            }},
            {"$match": {
                "passes": {"$gt": 0},
                "fails": {"$gt": 0},
                "total_runs": {"$gt": 2}
            }},
            {"$project": {
                "test_name": "$_id",
                "flakiness_score": {"$multiply": [{"$divide": ["$fails", "$total_runs"]}, 100]},
                "total_runs": 1,
                "passes": 1,
                "fails": 1
            }},
            {"$sort": {"flakiness_score": -1}},
            {"$limit": 10}
        ]
        cursor = db_client.db["test_cases"].aggregate(pipeline)
        results = await cursor.to_list(length=10)
        for r in results:
            del r["_id"]
            r["flakiness_score"] = round(r["flakiness_score"], 1)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/execution-time")
async def get_execution_time():
    if db_client.db is None:
        raise HTTPException(status_code=503, detail="Database connection not available")
    try:
        pipeline = [
            {"$project": {
                "project_name": 1,
                "estimated_time": {"$multiply": ["$total_tests", 15]}
            }},
            {"$group": {
                "_id": "$project_name",
                "avg_execution_time_sec": {"$avg": "$estimated_time"}
            }}
        ]
        cursor = db_client.db["runs"].aggregate(pipeline)
        results = await cursor.to_list(length=50)
        formatted = [{"project": r["_id"] or "Unknown", "avg_time_sec": round(r["avg_execution_time_sec"] or 0)} for r in results]
        return formatted
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stability-score")
async def get_stability_score():
    if db_client.db is None:
        raise HTTPException(status_code=503, detail="Database connection not available")
    try:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)
        pipeline = [
            {"$match": {"created_at": {"$gte": cutoff_date.isoformat()}}},
            {"$group": {
                "_id": None,
                "total_tests": {"$sum": "$total_tests"},
                "total_passed": {"$sum": "$passed"}
            }}
        ]
        cursor = db_client.db["runs"].aggregate(pipeline)
        results = await cursor.to_list(length=1)
        if not results or results[0]["total_tests"] == 0:
            return {"stability_score": 100.0, "trend": "stable"}
        total = results[0]["total_tests"]
        passed = results[0]["total_passed"]
        score = (passed / total) * 100
        return {
            "stability_score": round(score, 1),
            "trend": "up" if score > 90 else "down"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
