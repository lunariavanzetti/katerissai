# API Documentation

Complete API reference for the Kateriss AI Video Generator platform. This documentation covers all available endpoints, authentication methods, request/response formats, and integration examples.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URLs & Environments](#base-urls--environments)
4. [Request/Response Format](#requestresponse-format)
5. [Rate Limiting](#rate-limiting)
6. [Error Handling](#error-handling)
7. [Authentication Endpoints](#authentication-endpoints)
8. [Video Generation Endpoints](#video-generation-endpoints)
9. [Payment & Subscription Endpoints](#payment--subscription-endpoints)
10. [Usage Tracking Endpoints](#usage-tracking-endpoints)
11. [User Management Endpoints](#user-management-endpoints)
12. [Webhook Endpoints](#webhook-endpoints)
13. [SDK Examples](#sdk-examples)
14. [Testing](#testing)

## Overview

The Kateriss AI Video Generator API is built on Supabase and follows REST principles with some GraphQL-like features. All endpoints support JSON request/response format with proper HTTP status codes.

### API Features
- **RESTful Design**: Standard HTTP methods and status codes
- **JWT Authentication**: Secure token-based authentication
- **Real-time Updates**: WebSocket support for live updates
- **Comprehensive Error Handling**: Detailed error messages and codes
- **Rate Limiting**: Per-user and per-endpoint limits
- **Webhook Support**: Event-driven integrations

## Authentication

### JWT Token Authentication

All API requests require a valid JWT token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Authentication Flow

1. **Sign Up/Sign In** to get access token
2. **Include token** in all subsequent requests
3. **Refresh token** before expiry (24 hours)
4. **Handle token expiry** gracefully

### API Key Authentication (Enterprise)

For server-to-server integration, use API keys:

```http
X-API-Key: ak_live_1234567890abcdef
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Base URLs & Environments

### Production
```
API Base URL: https://kateriss.ai/api
Supabase URL: https://your-project.supabase.co
```

### Development
```
API Base URL: http://localhost:5173/api
Supabase URL: https://your-dev-project.supabase.co
```

### Staging
```
API Base URL: https://staging.kateriss.ai/api
Supabase URL: https://your-staging-project.supabase.co
```

## Request/Response Format

### Request Format

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}

{
  "data": {
    // Request payload
  }
}
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2025-09-09T10:00:00Z",
    "requestId": "req_1234567890"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "prompt",
        "message": "Prompt is required"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-09-09T10:00:00Z",
    "requestId": "req_1234567890"
  }
}
```

## Rate Limiting

### Rate Limits by Plan

| Plan | Video Generation | API Calls | Burst Limit |
|------|------------------|-----------|-------------|
| Pay-per-video | 1/hour | 100/hour | 10/minute |
| Basic | 5/hour | 500/hour | 20/minute |
| Premium | Unlimited | 2000/hour | 50/minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641234567
X-RateLimit-Retry-After: 3600
```

### Rate Limit Response

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1641234567

{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 3600 seconds.",
    "retryAfter": 3600
  }
}
```

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `409` | Conflict |
| `422` | Validation Error |
| `429` | Rate Limited |
| `500` | Internal Server Error |
| `503` | Service Unavailable |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_ERROR` | Invalid or missing authentication |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `PAYMENT_REQUIRED` | Payment required to continue |
| `QUOTA_EXCEEDED` | Usage quota exceeded |
| `GENERATION_FAILED` | Video generation failed |
| `INTERNAL_ERROR` | Internal server error |

## Authentication Endpoints

### POST /auth/signup

Register a new user account.

**Request:**
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "fullName": "John Doe",
  "metadata": {
    "referralCode": "FRIEND123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "fullName": "John Doe",
      "subscriptionTier": "pay-per-video",
      "createdAt": "2025-09-09T10:00:00Z"
    },
    "session": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400,
      "tokenType": "bearer"
    }
  }
}
```

### POST /auth/signin

Authenticate existing user.

**Request:**
```http
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "fullName": "John Doe",
      "subscriptionTier": "basic",
      "lastLogin": "2025-09-09T10:00:00Z"
    },
    "session": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400,
      "tokenType": "bearer"
    }
  }
}
```

### POST /auth/refresh

Refresh access token.

**Request:**
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "tokenType": "bearer"
  }
}
```

### POST /auth/signout

Sign out user and invalidate tokens.

**Request:**
```http
POST /auth/signout
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Successfully signed out"
  }
}
```

### POST /auth/password-reset

Request password reset.

**Request:**
```http
POST /auth/password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent"
  }
}
```

## Video Generation Endpoints

### POST /videos/generate

Create a new video generation request.

**Request:**
```http
POST /videos/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Amazing AI Video",
  "prompt": "A beautiful sunset over mountains with birds flying",
  "settings": {
    "duration": 5,
    "resolution": "1080p",
    "aspectRatio": "16:9",
    "style": "realistic",
    "seed": 12345
  },
  "priority": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "video": {
      "id": "vid_1234567890",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Amazing AI Video",
      "prompt": "A beautiful sunset over mountains with birds flying",
      "status": "pending",
      "stage": "queued",
      "progress": 0,
      "queuePosition": 3,
      "estimatedTimeRemaining": 180,
      "createdAt": "2025-09-09T10:00:00Z"
    },
    "usage": {
      "creditsUsed": 1,
      "creditsRemaining": 19,
      "videosThisMonth": 1,
      "videoLimit": 20
    }
  }
}
```

### GET /videos/{videoId}

Get video details and status.

**Request:**
```http
GET /videos/vid_1234567890
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "video": {
      "id": "vid_1234567890",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Amazing AI Video",
      "prompt": "A beautiful sunset over mountains with birds flying",
      "enhancedPrompt": "A beautiful sunset over mountains with birds flying, realistic style, high definition, clear details, professional cinematography, smooth motion",
      "status": "completed",
      "stage": "completed",
      "progress": 100,
      "videoUrl": "https://storage.kateriss.ai/videos/2025/user/vid_1234567890.mp4",
      "thumbnailUrl": "https://storage.kateriss.ai/thumbnails/2025/user/vid_1234567890/thumb.jpg",
      "duration": 5.2,
      "resolution": "1920x1080",
      "fileSize": 15728640,
      "format": "mp4",
      "generationTime": 145,
      "createdAt": "2025-09-09T10:00:00Z",
      "completedAt": "2025-09-09T10:02:25Z"
    }
  }
}
```

### GET /videos

List user's videos with filtering and pagination.

**Request:**
```http
GET /videos?status=completed&limit=10&offset=0&orderBy=createdAt&orderDirection=desc
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": "vid_1234567890",
        "title": "Amazing AI Video",
        "prompt": "A beautiful sunset over mountains...",
        "status": "completed",
        "thumbnailUrl": "https://storage.kateriss.ai/thumbnails/thumb.jpg",
        "duration": 5.2,
        "createdAt": "2025-09-09T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "offset": 0,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### DELETE /videos/{videoId}

Delete a video.

**Request:**
```http
DELETE /videos/vid_1234567890
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Video deleted successfully"
  }
}
```

### POST /videos/{videoId}/favorite

Toggle video favorite status.

**Request:**
```http
POST /videos/vid_1234567890/favorite
Authorization: Bearer {token}
Content-Type: application/json

{
  "isFavorite": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isFavorite": true
  }
}
```

### GET /videos/queue

Get current video generation queue status.

**Request:**
```http
GET /videos/queue
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "queue": [
      {
        "videoId": "vid_1234567891",
        "title": "My Video",
        "position": 1,
        "estimatedWaitMinutes": 5,
        "priority": 2
      }
    ],
    "totalInQueue": 15,
    "averageWaitTime": 8,
    "processingCapacity": 5
  }
}
```

## Payment & Subscription Endpoints

### GET /billing/plans

Get available pricing plans.

**Request:**
```http
GET /billing/plans
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "pay-per-video",
        "name": "Pay Per Video",
        "type": "one-time",
        "price": 2.49,
        "currency": "USD",
        "features": ["1 video generation"],
        "paddleProductId": "pro_01h1234567890"
      },
      {
        "id": "basic",
        "name": "Basic Monthly",
        "type": "subscription",
        "price": 29.00,
        "currency": "USD",
        "interval": "month",
        "features": ["20 videos/month", "HD quality", "Basic support"],
        "paddleProductId": "pro_01h1234567891"
      },
      {
        "id": "premium", 
        "name": "Premium Monthly",
        "type": "subscription",
        "price": 149.00,
        "currency": "USD",
        "interval": "month",
        "features": ["Unlimited videos", "4K quality", "Commercial rights", "Priority support"],
        "paddleProductId": "pro_01h1234567892"
      }
    ]
  }
}
```

### POST /billing/checkout

Create checkout session.

**Request:**
```http
POST /billing/checkout
Authorization: Bearer {token}
Content-Type: application/json

{
  "planId": "basic",
  "successUrl": "https://kateriss.ai/dashboard?checkout=success",
  "cancelUrl": "https://kateriss.ai/pricing?checkout=cancel"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.paddle.com/checkout?_ptxn=txn_1234567890",
    "sessionId": "ses_1234567890"
  }
}
```

### GET /billing/subscription

Get current subscription details.

**Request:**
```http
GET /billing/subscription
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "sub_1234567890",
      "plan": "basic",
      "status": "active",
      "currentPeriodStart": "2025-09-01T00:00:00Z",
      "currentPeriodEnd": "2025-10-01T00:00:00Z",
      "cancelAtPeriodEnd": false,
      "canceledAt": null,
      "trialStart": null,
      "trialEnd": null
    },
    "billing": {
      "amount": 29.00,
      "currency": "USD",
      "interval": "month",
      "nextBillingDate": "2025-10-01T00:00:00Z"
    }
  }
}
```

### POST /billing/subscription/cancel

Cancel subscription.

**Request:**
```http
POST /billing/subscription/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "immediately": false,
  "reason": "No longer needed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "sub_1234567890",
      "status": "active",
      "cancelAtPeriodEnd": true,
      "canceledAt": "2025-09-09T10:00:00Z",
      "currentPeriodEnd": "2025-10-01T00:00:00Z"
    }
  }
}
```

### GET /billing/invoices

Get billing history and invoices.

**Request:**
```http
GET /billing/invoices?limit=10&offset=0
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": "inv_1234567890",
        "number": "INV-2025-001234",
        "status": "paid",
        "amount": 29.00,
        "currency": "USD",
        "description": "Basic Monthly Plan",
        "issuedAt": "2025-09-01T00:00:00Z",
        "paidAt": "2025-09-01T00:05:00Z",
        "downloadUrl": "https://kateriss.ai/invoices/inv_1234567890.pdf"
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 10,
      "offset": 0
    }
  }
}
```

## Usage Tracking Endpoints

### GET /usage/current

Get current usage statistics.

**Request:**
```http
GET /usage/current
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "usage": {
      "plan": "basic",
      "periodStart": "2025-09-01T00:00:00Z",
      "periodEnd": "2025-10-01T00:00:00Z",
      "videosGenerated": 12,
      "videosLimit": 20,
      "videosRemaining": 8,
      "creditsUsed": 12,
      "creditsTotal": 20,
      "overageVideos": 0,
      "overageCharges": 0,
      "resetDate": "2025-10-01T00:00:00Z"
    }
  }
}
```

### GET /usage/history

Get usage history.

**Request:**
```http
GET /usage/history?months=6
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "period": "2025-09",
        "videosGenerated": 12,
        "videosLimit": 20,
        "overageVideos": 0,
        "totalCost": 29.00
      },
      {
        "period": "2025-08", 
        "videosGenerated": 18,
        "videosLimit": 20,
        "overageVideos": 0,
        "totalCost": 29.00
      }
    ]
  }
}
```

### GET /usage/analytics

Get detailed usage analytics.

**Request:**
```http
GET /usage/analytics?period=30d
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analytics": {
      "totalVideos": 45,
      "completedVideos": 42,
      "failedVideos": 3,
      "averageGenerationTime": 125,
      "totalViews": 1250,
      "totalDownloads": 340,
      "favoriteVideos": 8,
      "dailyStats": [
        {
          "date": "2025-09-09",
          "videosGenerated": 3,
          "views": 25,
          "downloads": 8
        }
      ]
    }
  }
}
```

## User Management Endpoints

### GET /user/profile

Get user profile information.

**Request:**
```http
GET /user/profile
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "fullName": "John Doe",
      "avatarUrl": "https://storage.kateriss.ai/avatars/user.jpg",
      "bio": "AI video enthusiast",
      "website": "https://johndoe.com",
      "subscriptionTier": "basic",
      "onboardingCompleted": true,
      "lastLogin": "2025-09-09T09:30:00Z",
      "createdAt": "2025-08-01T00:00:00Z"
    }
  }
}
```

### PUT /user/profile

Update user profile.

**Request:**
```http
PUT /user/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullName": "John Smith",
  "bio": "Professional video creator",
  "website": "https://johnsmith.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "fullName": "John Smith",
      "bio": "Professional video creator",
      "website": "https://johnsmith.com",
      "updatedAt": "2025-09-09T10:00:00Z"
    }
  }
}
```

### POST /user/api-keys

Generate new API key.

**Request:**
```http
POST /user/api-keys
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Production API Key",
  "permissions": ["video:generate", "video:read", "usage:read"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "apiKey": {
      "id": "key_1234567890",
      "name": "Production API Key",
      "keyPrefix": "ak_live_12345678",
      "key": "ak_live_1234567890abcdef1234567890abcdef",
      "permissions": ["video:generate", "video:read", "usage:read"],
      "createdAt": "2025-09-09T10:00:00Z",
      "expiresAt": null
    }
  }
}
```

### GET /user/api-keys

List user's API keys.

**Request:**
```http
GET /user/api-keys
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "apiKeys": [
      {
        "id": "key_1234567890",
        "name": "Production API Key",
        "keyPrefix": "ak_live_12345678",
        "permissions": ["video:generate", "video:read", "usage:read"],
        "lastUsedAt": "2025-09-09T09:30:00Z",
        "usageCount": 156,
        "isActive": true,
        "createdAt": "2025-08-15T00:00:00Z"
      }
    ]
  }
}
```

### DELETE /user/api-keys/{keyId}

Revoke API key.

**Request:**
```http
DELETE /user/api-keys/key_1234567890
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "API key revoked successfully"
  }
}
```

## Webhook Endpoints

### POST /webhooks/paddle

Handle Paddle payment webhooks.

**Request Headers:**
```http
X-Paddle-Signature: t=1641234567,h1=abc123...
Content-Type: application/json
```

**Supported Events:**
- `subscription.created`
- `subscription.updated` 
- `subscription.canceled`
- `transaction.completed`
- `transaction.payment_failed`

**Example Payload:**
```json
{
  "event_type": "subscription.created",
  "data": {
    "id": "sub_1234567890",
    "customer_id": "ctm_1234567890",
    "plan_id": "pln_basic_monthly",
    "status": "active",
    "current_period_start": "2025-09-09T10:00:00Z",
    "current_period_end": "2025-10-09T10:00:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processed": true,
    "message": "Webhook processed successfully"
  }
}
```

## SDK Examples

### JavaScript/TypeScript SDK

```javascript
import { KaterissClient } from '@kateriss/sdk';

const client = new KaterissClient({
  apiKey: 'ak_live_1234567890abcdef',
  baseUrl: 'https://kateriss.ai/api'
});

// Generate video
const video = await client.videos.generate({
  title: 'My AI Video',
  prompt: 'A beautiful landscape with mountains',
  settings: {
    duration: 5,
    resolution: '1080p'
  }
});

// Get video status
const status = await client.videos.get(video.id);

// List videos
const videos = await client.videos.list({
  status: 'completed',
  limit: 10
});
```

### Python SDK

```python
from kateriss import KaterissClient

client = KaterissClient(
    api_key='ak_live_1234567890abcdef',
    base_url='https://kateriss.ai/api'
)

# Generate video
video = client.videos.generate(
    title='My AI Video',
    prompt='A beautiful landscape with mountains',
    settings={
        'duration': 5,
        'resolution': '1080p'
    }
)

# Get video status
status = client.videos.get(video.id)

# List videos
videos = client.videos.list(status='completed', limit=10)
```

### cURL Examples

**Generate Video:**
```bash
curl -X POST https://kateriss.ai/api/videos/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My AI Video",
    "prompt": "A beautiful landscape with mountains",
    "settings": {
      "duration": 5,
      "resolution": "1080p"
    }
  }'
```

**Get Video Status:**
```bash
curl -X GET https://kateriss.ai/api/videos/vid_1234567890 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing

### Test Environment

Use the sandbox environment for testing:

```
Base URL: https://sandbox.kateriss.ai/api
Paddle Environment: sandbox
```

### Test Credentials

```json
{
  "email": "test@example.com",
  "password": "testpassword123"
}
```

### Test API Keys

```
Test API Key: ak_test_1234567890abcdef
```

### Mock Responses

Enable mock responses for testing:

```http
X-Mock-Response: true
```

### Webhook Testing

Use tools like ngrok for local webhook testing:

```bash
# Expose local server
ngrok http 3000

# Use the HTTPS URL for webhook endpoint
https://abcd1234.ngrok.io/webhooks/paddle
```

---

## Support

For API support:
- **Documentation**: [https://docs.kateriss.ai](https://docs.kateriss.ai)
- **Support Email**: api-support@kateriss.ai
- **Discord**: [Kateriss Developers](https://discord.gg/kateriss)
- **GitHub Issues**: [kateriss-ai/video-generator](https://github.com/kateriss-ai/video-generator)

---

*Last Updated: 2025-09-09 | Version: 1.0.0*