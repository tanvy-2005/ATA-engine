import asyncio
import websockets

async def fetch_logs():
    try:
        async with websockets.connect('ws://127.0.0.1:8000/api/logs/ws') as ws:
            print('Connected')
            logs = []
            try:
                while True:
                    msg = await asyncio.wait_for(ws.recv(), timeout=1.0)
                    logs.append(msg)
            except Exception:
                pass
            print('\n'.join(logs[-50:]))
    except Exception as e:
        print("Failed to connect:", e)

asyncio.run(fetch_logs())
