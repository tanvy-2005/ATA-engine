import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()
client = AsyncIOMotorClient(os.getenv('DB_URL'))
db = client[os.getenv('DB_NAME')]

async def main():
    workspaces = await db.workspaces.find().to_list(100)
    print("=== WORKSPACES ===")
    for w in workspaces:
        print(f"ID: {w['_id']}, Name: {w.get('name')}")
    
    members = await db.workspace_members.find().to_list(100)
    print("\n=== MEMBERS ===")
    for m in members:
        print(f"WS_ID: {m.get('workspace_id')} ({type(m.get('workspace_id'))}), User: {m.get('user_id')}")

if __name__ == '__main__':
    asyncio.run(main())
