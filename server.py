# server.py

import asyncio
import websockets

async def handle_client(websocket, path):
    while True:
        message = await websocket.recv()
        print(f"Received message from client: {message}")

        # Process message and generate response
        response = f"Echoing back: {message}"
        
        # Send response back to client
        await websocket.send(response)

async def main():
    async with websockets.serve(handle_client, "localhost", 8765):
        print("WebSocket server running on ws://localhost:8765")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())
