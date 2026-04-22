---
name: nats
description: "Use when implementing pub/sub messaging, event-driven architectures, microservices communication, or distributed systems with NATS. Covers NATS core concepts, JetStream, client libraries (Node.js/Go/Python), configuration, and troubleshooting."
tools: Read, Write, Edit, Bash, Grep
model: sonnet
---

# NATS Messaging Skill

You are an expert in NATS messaging system for building distributed systems and event-driven architectures.

## Core Concepts

### Communication Patterns

```
1. Publish/Subscribe (PubSub)
   Publisher → "subject" → Subscriber(s)
   Use: Event broadcasting, notifications

2. Request/Reply (Service)
   Requester → "subject" → Responder
   Use: RPC, query services

3. Stream Processing (JetStream)
   Producer → Stream → Consumer (with replay capability)
   Use: Event sourcing, audit logs, async processing
```

### Subject Naming Convention

```
{service}.{action}.{resource}

Examples:
- auth.generate.token
- user.created
- payment.processed
- order.shipped
```

## Client Libraries

### Node.js (nats.js)

```javascript
import { connect } from 'nats';

const nc = await connect({ servers: ['nats://localhost:4222'] });

// Publish
nc.publish('subject', JSON.stringify({ data: 'value' }));

// Subscribe
const sub = nc.subscribe('subject', (err, msg) => {
  if (err) {
    console.error('Subscription error:', err);
    return;
  }
  const data = JSON.parse(msg.data);
  console.log('Received:', data);
});

// Unsubscribe
sub.unsubscribe();

// Request/Reply
const response = await nc.request('service.method', JSON.stringify({ query: 'data' }));
console.log(JSON.parse(response.data));

// Close
await nc.close();
```

### Connection Options

```javascript
const nc = await connect({
  servers: ['nats://localhost:4222'],
  name: 'my-service',
  user: 'username',
  pass: 'password',
  token: 'token',
  maxReconnectAttempts: 10,
  reconnectTimeWait: 2000,
  timeout: 5000,
  tls: { /* TLS config */ }
});
```

### Go (nats-go)

```go
import "github.com/nats-io/nats.go"

nc, _ := nats.Connect("nats://localhost:4222")
defer nc.Close()

// Publish
nc.Publish("subject", []byte("message"))

// Subscribe
sub, _ := nc.Subscribe("subject", func(msg *nats.Msg) {
    fmt.Println(string(msg.Data))
})
defer sub.Unsubscribe()

// Request/Reply
response, _ := nc.Request("service.method", []byte("request"), time.Second*5)
fmt.Println(string(response.Data))
```

### Python (asyncio-nats)

```python
import asyncio
from nats import NATS

async def main():
    nc = await NATS().connect("nats://localhost:4222")
    
    # Publish
    await nc.publish("subject", b'{"data": "value"}')
    
    # Subscribe
    async def handler(msg):
        print(f"Received: {msg.data}")
    
    await nc.subscribe("subject", cb=handler)
    
    # Request/Reply
    response = await nc.request("service.method", b'request', timeout=5)
    print(response.data)
    
    await nc.close()

asyncio.run(main())
```

## JetStream (Persistence)

### Server Configuration

```conf
jetstream {
    store_dir: /data/nats/jetstream
    max_memory_store: 1GB
    max_file_store: 10GB
}
```

### Publishing with JetStream

```javascript
// Enable JetStream
const nc = await connect({ servers: ['nats://localhost:4222'] });
const js = nc.jetstream();

// Publish with persistence
const pubAck = await js.publish('events.order', JSON.stringify(order), {
    stream: 'ORDERS',
    subject: 'orders.created'
});
console.log('Published:', pubAck.sequence);
```

### Consuming with JetStream

```javascript
const js = nc.jetstream();
const sub = await js.subscribe('events.order', {
    stream: 'ORDERS',
    consumer: 'my-consumer',
    deliverPolicy: 'all'  // 'all', 'last', 'new', 'by_start_sequence', 'by_start_time'
});

// Process messages
for await (const msg of sub) {
    const data = JSON.parse(msg.data);
    await processMessage(data);
    msg.ack();  // Acknowledge message
}
```

## Common Patterns

### Pattern 1: Fire-and-Forget Events

```javascript
// Publisher
await nc.publish('user.created', JSON.stringify({
    userId: user.id,
    email: user.email,
    timestamp: new Date().toISOString()
}));

// Subscriber
nc.subscribe('user.created', (err, msg) => {
    const event = JSON.parse(msg.data);
    sendWelcomeEmail(event.email);
});
```

### Pattern 2: Request/Reply with Timeout

```javascript
// Requester
try {
    const response = await nc.request('auth.validate_token', JSON.stringify({
        token: 'jwt-token'
    }), { timeout: 5000 });
    const result = JSON.parse(response.data);
    console.log('Valid:', result.valid);
} catch (err) {
    console.error('Request failed:', err.message);
}

// Responder
nc.subscribe('auth.validate_token', (err, msg) => {
    const { token } = JSON.parse(msg.data);
    const valid = validateJWT(token);
    nc.publish(msg.reply, JSON.stringify({ valid }));
});
```

### Pattern 3: Worker Pool with Queue

```javascript
// Tasks are distributed across subscribers in round-robin
const sub = nc.subscribe('tasks.process', {
    queue: 'workers'  // Queue group ensures only one subscriber gets each message
});

sub.callback = (err, msg) => {
    const task = JSON.parse(msg.data);
    processTask(task).then(() => {
        msg.ack();
    });
};
```

### Pattern 4: Streaming with Durable Consumer

```javascript
const js = nc.jetstream();

// Create durable consumer
await js.addConsumer('EVENTS', {
    durable: 'processor-1',
    deliverPolicy: 'all',
    ackPolicy: 'explicit'
});

// Consume messages
const consumer = await js.consume('EVENTS', { durable: 'processor-1' });
for await (const msg of consumer) {
    await processMessage(JSON.parse(msg.data));
    msg.ack();
}
```

## Server Configuration

### Basic Configuration

```conf
listen: 0.0.0.0:4222
http_port: 8222

max_connections: 1000
max_payload: 8MB
max_subscriptions: 1000

write_deadline: "10s"
```

### Production with Authentication

```conf
listen: 0.0.0.0:4222
http_port: 8222

max_connections: 10000
max_payload: 8MB

cluster {
    name: production
    port: 6222
    routes: ["nats://localhost:6222"]
}

jetstream {
    store_dir: /data/nats/jetstream
    max_file_store: 100GB
}

authorization {
    token: "secure-token-here"
    default_permissions: {
        subscribe: ["events.>", "services.>"]
        publish: ["events.>", "services.>"]
    }
}
```

### Docker Compose

```yaml
nats:
  image: nats:2.10-alpine
  ports:
    - "4222:4222"
    - "8222:8222"
  volumes:
    - nats_data:/data
  command: ["-c", "/etc/nats/nats-server.conf"]
  healthcheck:
    test: ["CMD", "wget", "-q", "http://localhost:8222/healthz"]
    interval: 10s
    timeout: 5s
    retries: 5
```

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `no servers available` | NATS server not running | Start server: `nats-server -c config.conf` |
| `connection refused` | Wrong port | Default port is 4222, check config |
| `authentication error` | Wrong credentials | Verify user/pass/token in config |
| Messages not received | Subject mismatch | Check spelling exactly, case-sensitive |
| Slow consumer | Processing too slow | Increase `max_pending`, optimize processing |
| JetStream errors | Storage issues | Check `store_dir` permissions, disk space |

### Debug Mode

```conf
debug: true
trace: true
trace_verbose: true
```

Check logs:
```bash
curl http://localhost:8222/varz
curl http://localhost:8222/healthz
```

### Health Check

```bash
curl http://localhost:8222/healthz
# Returns: {"status":"ok","mode":"standalone","version":"2.10.x"}
```

## Testing

### NATS CLI

```bash
# Install
go install github.com/nats-io/nats-cli/nats@latest

# Subscribe
nats sub 'events.>'

# Publish
nats pub events.user.created '{"userId":"123"}'

# Request/Reply
nats req auth.validate '{"token":"xyz"}'
```

### Test Script

```javascript
// test-nats.js
import { connect } from 'nats';

async function testNATS() {
    const nc = await connect({ servers: ['nats://localhost:4222'] });
    
    // Test publish/subscribe
    const results = [];
    const sub = nc.subscribe('test.subject', (err, msg) => {
        if (!err) results.push(JSON.parse(msg.data));
    });
    
    await nc.publish('test.subject', JSON.stringify({ hello: 'world' }));
    await new Promise(r => setTimeout(r, 500));
    
    console.log('Test results:', results);
    
    sub.unsubscribe();
    await nc.close();
}

testNATS().catch(console.error);
```

## Quality Checklist

- [ ] Use JSON serialization for all messages
- [ ] Handle connection errors with reconnection logic
- [ ] Implement proper message acknowledgment
- [ ] Use meaningful subject naming (service.action.resource)
- [ ] Set appropriate timeouts for request/reply
- [ ] Configure JetStream for persistent messages
- [ ] Implement health checks for monitoring
- [ ] Use queue groups for parallel processing
- [ ] Set up proper error handling in subscribers
- [ ] Configure TLS in production environments
