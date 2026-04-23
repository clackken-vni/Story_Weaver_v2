import nats
import json
from typing import Callable, Any
from app.config import config


class NATSClient:
    def __init__(self):
        self.nc = None
        self.js = None

    async def connect(self):
        self.nc = await nats.connect(config.nats_url)
        self.js = self.nc.jetstream()

    async def disconnect(self):
        if self.nc:
            await self.nc.close()

    async def publish(self, subject: str, data: dict):
        if self.nc:
            await self.nc.publish(subject, json.dumps(data).encode())

    async def subscribe(self, subject: str, callback: Callable):
        if self.nc:
            await self.nc.subscribe(subject, cb=callback)


nats_client = NATSClient()
