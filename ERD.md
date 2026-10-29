# ICT Inventory ERD

This diagram shows the main columns in the current Supabase schema. `AUTH_USERS` is Supabase's `auth.users` table; the other entities are in the `public` schema.

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK
        text email
    }

    AUTHORIZED_ACCOUNTS {
        uuid id PK
        text email UK
        text full_name
        uuid auth_user_id FK
    }

    PENDING_ACCOUNT_EMAIL_CHANGES {
        uuid auth_user_id PK,FK
        uuid account_id FK
        text new_email
    }

    ACCOUNT_SESSIONS {
        uuid session_id PK
        uuid account_id FK
        uuid auth_user_id
        timestamptz last_seen_at
    }

    EQUIPMENT {
        uuid id PK
        text property_number UK
        text equipment_type
        text model
        text location
        text accountable_personnel
        text status
        jsonb verification_history
        jsonb ownership_history
    }

    ACTIVITY_LOG {
        bigint id PK
        uuid actor_user_id
        uuid session_id
        text action
        text target_type
        uuid target_id
        timestamptz occurred_at
    }

    SECURITY_RATE_LIMITS {
        text key_hash PK
        integer attempts
        timestamptz reset_at
    }

    AUTH_USERS |o..o{ AUTHORIZED_ACCOUNTS : "auth_user_id"
    AUTH_USERS ||--o| PENDING_ACCOUNT_EMAIL_CHANGES : "auth_user_id"
    AUTHORIZED_ACCOUNTS ||..o{ PENDING_ACCOUNT_EMAIL_CHANGES : "account_id"
    AUTHORIZED_ACCOUNTS ||..o{ ACCOUNT_SESSIONS : "account_id"
```

Lines show declared foreign keys; the solid line is identifying because `pending_account_email_changes.auth_user_id` is also its primary key. The `activity_log` columns `actor_user_id`, `session_id`, and `target_id` are logical references without foreign-key constraints. `target_id` refers to equipment only when `target_type = 'equipment'`. `security_rate_limits` is standalone. Equipment verification and ownership histories are stored as JSONB in `equipment`, rather than in separate tables.

Source: [`lib/supabase/schema.sql`](lib/supabase/schema.sql).
