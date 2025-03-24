# Event Sourcing Pattern Implementation

This document describes the implementation of the Event Sourcing pattern in the Helpdesk Gateway application.

## Overview

Event Sourcing is a pattern that captures all changes to an application's state as a sequence of events. Instead of storing just the current state, we store the full history of actions that led to that state.

## Key Components

### 1. Command

A command represents user intent or a request to change the system state. Commands are not stored directly but are transformed into events.

Example:
```typescript
const command = { 
  type: 'AUTHENTICATE_USER',
  email: 'user@example.com',
  password: 'password123',
  timestamp: Date.now()
};
```

### 2. Transition Function

A pure function that processes commands and produces events. It contains the business logic for validating commands and determining the resulting events.

```typescript
export const authTransition = (
  verifyZohoUser: (email: string, password: string) => Promise<any>,
  storeEvent: (userId: string, command: any, event: any) => Promise<any>
) => (command: { email: string; password: string }): Promise<any> => {
  // Implementation details...
};
```

### 3. Event

An event represents something that has happened in the system. Events are immutable facts that are stored in the event store.

Example:
```typescript
const event = {
  type: 'AUTH_SUCCESS',
  user_id: 'user@example.com',
  timestamp: Date.now(),
  user_data: { /* user details */ }
};
```

### 4. Event Store

A persistent storage for events. In our case, we use a Supabase table called `auth_event_store`.

## Implementation Details

### Event Store Schema

```sql
CREATE TABLE auth_event_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  command JSONB NOT NULL,
  event JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Functional Core, Imperative Shell (FCIS) Architecture

Our implementation follows the FCIS architecture:

1. **Functional Core**: Pure transition functions that convert commands to events.
2. **Imperative Shell**: IO operations for verifying users and storing events.

### Benefits

1. **Complete Audit Trail**: Every authentication attempt is recorded with full context.
2. **Time Travel**: Ability to reconstruct the state at any point in time.
3. **Separation of Concerns**: Clear distinction between business logic and IO operations.
4. **Testability**: Pure functions are easy to test without mocking external dependencies.

## Usage Example

```typescript
import { configuredAuthTransition } from '../shell/config/auth.config';

// Create a command
const command = { email: 'user@example.com', password: 'password123' };

// Process the command
configuredAuthTransition(command)
  .then(event => {
    console.log('Authentication successful:', event);
  })
  .catch(event => {
    console.log('Authentication failed:', event);
  });
```

## Event Replay

Events can be replayed to reconstruct the state of the system at any point in time. Supabase provides a function to replay authentication events:

```sql
SELECT replay_auth_events('user@example.com');
```

## Future Enhancements

1. **Event Versioning**: Add versioning to events to handle schema changes.
2. **Snapshots**: Implement snapshots for performance optimization.
3. **Event Projections**: Create specialized read models from the event store.
