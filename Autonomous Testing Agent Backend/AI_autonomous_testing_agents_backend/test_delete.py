import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()
client = AsyncIOMotorClient(os.getenv('DB_URL'))
db = client[os.getenv('DB_NAME')]

async def main():
    print("Trying to delete 6a6c3ff0cb063eaed648ddd1")
    ws_id = ObjectId("6a6c3ff0cb063eaed648ddd1")
    
    # Try deleting it
    res1 = await db.workspaces.delete_one({"_id": ws_id})
    res2 = await db.workspace_members.delete_many({"workspace_id": ws_id})
    
    print(f"Workspaces deleted: {res1.deleted_count}")
    print(f"Members deleted: {res2.deleted_count}")
    
    # Check if it still exists
    still_exists = await db.workspaces.find_one({"_id": ws_id})
    print(f"Still exists? {still_exists is not None}")

if __name__ == '__main__':
    asyncio.run(main())
