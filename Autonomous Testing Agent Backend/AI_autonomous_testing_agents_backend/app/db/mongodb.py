from motor.motor_asyncio import AsyncIOMotorClient
import certifi
import dns.resolver
from app.core.config import settings

# Configure dnspython to use public DNS servers (Google/Cloudflare) first,
# preventing local router DNS (e.g. 192.168.1.1) from refusing SRV queries for mongodb+srv://
try:
    dns.resolver.default_resolver = dns.resolver.Resolver()
    dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4', '1.1.1.1'] + dns.resolver.default_resolver.nameservers
except Exception as e:
    print(f"Warning: Could not configure custom DNS nameservers: {e}")

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db_client = MongoDB()

async def connect_to_mongo():
    try:
        dns.resolver.default_resolver = dns.resolver.Resolver()
        dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4', '1.1.1.1'] + dns.resolver.default_resolver.nameservers
    except Exception as e:
        print(f"Warning: Could not configure custom DNS nameservers: {e}")

    db_client.client = AsyncIOMotorClient(
        settings.DB_URL, 
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000
    )
    db_client.db = db_client.client[settings.DB_NAME]
    print("Connected to MongoDB")
    
    # Create performance indexes
    try:
        await db_client.db["projects"].create_index("workspaceId")
        await db_client.db["projects"].create_index("created_at")
        await db_client.db["workspaces"].create_index("slug", unique=True)
        await db_client.db["workspaces"].create_index("created_at")
        await db_client.db["users"].create_index("email", unique=True)
        print("MongoDB indexes initialized successfully")
    except Exception as e:
        print(f"Warning: Failed to create indexes: {e}")

async def close_mongo_connection():
    if db_client.client:
        db_client.client.close()
        print("Closed MongoDB connection")
