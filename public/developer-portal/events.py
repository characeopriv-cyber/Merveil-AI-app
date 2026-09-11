import asyncio
from typing import Any, AsyncIterator

class EventBus:
    def __init__(self, run_id: str):
        self.run_id = run_id
        self._q: asyncio.Queue = asyncio.Queue()
        self._closed = False

    async def emit(self, event: dict):
        event = {**event, "run_id": self.run_id}
        await self._q.put(event)

    def close(self):
        self._closed = True
        self._q.put_nowait(None)

    async def consume(self) -> AsyncIterator[dict]:
        while True:
            item = await self._q.get()
            if item is None:
                break
            yield item
