import asyncio
import websockets

async def echo(websocket, path):
    async for message in websocket:
        print("Received message: " + message)
        # Simply echo back received messages for now
        await websocket.send(message)

async def main():
    async with websockets.serve(echo, "127.0.0.1", 8765):
        print("WebSocket server running on ws://127.0.0.1:8765")
        await asyncio.Future()  # This will run forever

if __name__ == "__main__":
    asyncio.run(main())
