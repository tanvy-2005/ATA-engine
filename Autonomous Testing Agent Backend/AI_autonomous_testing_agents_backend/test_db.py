import asyncio
import motor.motor_asyncio
import pprint

async def run():
    url = "mongodb+srv://wwwshibacom08_db_user:RmKVp8dRZ6A6QP9t@cluster0.jq0jyaq.mongodb.net/testing?retryWrites=true&w=majority&appName=Cluster0"
    db = motor.motor_asyncio.AsyncIOMotorClient(url)["testing"]
    latest = await db.runs.find_one({}, sort=[('created_at', -1)])
    print("Latest Run:")
    pprint.pprint(latest)
    
    if latest:
        exec_id = str(latest.get('execution_id') or latest.get('_id'))
        print(f"Exec ID: {exec_id}")
        report = await db.reports.find_one({'execution_id': exec_id})
        print('Report overall assessment:')
        if report:
            print(report.get('overall_assessment'))
            print("Bug Summary:")
            pprint.pprint(report.get('bug_summary'))
            print("Report status:")
            print(report.get('overall_status'))
        else:
            print("None")

asyncio.run(run())
