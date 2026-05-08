# CampusFlow Frontend - Comprehensive Guide

A modern, responsive **Next.js 15** + **React 19** + **TypeScript** monorepo powering dual-portal academic management system. Features real-time SSE announcements, web push notifications, geofence-based attendance tracking with live maps, and full PWA support for installability and offline capability.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Setup & Installation](#setup--installation)
- [Development](#development)
- [Build & Deployment](#build--deployment)
- [File Structure Guide](#file-structure-guide)
- [Components & Hooks](#components--hooks)
- [API Integration](#api-integration)
- [Authentication](#authentication)
- [Real-time Features](#real-time-features)
- [PWA Setup](#pwa-setup)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 📱 Overview

**CampusFlow Frontend** is an integrated academic management interface split into two specialized portals:

### **Student Portal** (`apps/student-portal`)
- Dashboard with enrollment stats and quick actions
- Submit attendance with GPS validation
- View and manage assignments & submissions
- Take online assessments & view progress
- Receive real-time announcements
- Enable push notifications for background delivery
- Installable PWA for home screen access

### **Staff Portal** (`apps/staff-portal`)
- Course management and attendance tracking
- Start geofence attendance sessions with live map
- Publish announcements with real-time SSE delivery
- View analytics and student engagement
- Manage assessments and grading

### Architecture Pattern
- **Monorepo**: Single repository, two deployable Next.js apps
- **Shared Code**: `src/` folder with API clients, components, utilities, types
- **Independent Deployment**: Each portal deploys as separate Vercel project
- **Real-time**: SSE for immediate + Web Push for background notifications

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│              CampusFlow Frontend Monorepo                   │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Shared Services Layer (src/)                        │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │ API Client (Axios + interceptors)           │   │  │
│  │  │ • Auto JWT attachment                       │   │  │
│  │  │ • 401 handling & redirect                   │   │  │
│  │  │ • Error standardization                     │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │ State Management (Zustand)                  │   │  │
│  │  │ • Auth store (user, token, login/logout)   │   │  │
│  │  │ • Session persistence (localStorage)       │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │ React Query Integration                     │   │  │
│  │  │ • Automatic caching & deduplication        │   │  │
│  │  │ • Background refetches                     │   │  │
│  │  │ • Optimistic updates                       │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │ Real-time Services                          │   │  │
│  │  │ • SSE EventSource subscription              │   │  │
│  │  │ • Web Push registration & subscription      │   │  │
│  │  │ • Notification API fallback                 │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │ Utilities & Helpers                         │   │  │
│  │  │ • Geolocation (GPS capture + accuracy)      │   │  │
│  │  │ • Reverse geocoding (address lookup)        │   │  │
│  │  │ • Device fingerprinting                     │   │  │
│  │  │ • Session storage (token management)        │   │  │
│  │  │ • Error parsing & formatting                │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │ Shared UI Components                        │   │  │
│  │  │ • Buttons, inputs, cards, dialogs           │   │  │
│  │  │ • Data tables, sidebars, breadcrumbs        │   │  │
│  │  │ • Empty states, badges, tooltips            │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────────────────┬──────────────────────────────┐  │
│  │                         │                              │  │
│  │  STUDENT PORTAL         │   STAFF PORTAL               │  │
│  │  (Port 3000)            │   (Port 3001)                │  │
│  │                         │                              │  │
│  │  ┌─────────────────┐   │  ┌─────────────────────────┐ │  │
│  │  │ Pages           │   │  │ Pages                   │ │  │
│  │  │ • Dashboard     │   │  │ • Attendance Dashboard  │ │  │
│  │  │ • Attendance    │   │  │ • Session Start Modal   │ │  │
│  │  │ • Assignments   │   │  │ • Announcements         │ │  │
│  │  │ • Assessments   │   │  │ • Course Management     │ │  │
│  │  │ • Announcements │   │  │ • Analytics             │ │  │
│  │  │ • Profile       │   │  └─────────────────────────┘ │  │
│  │  └─────────────────┘   │                              │  │
│  │                         │  ┌─────────────────────────┐ │  │
│  │  ┌─────────────────┐   │  │ Components              │ │  │
│  │  │ Components      │   │  │ • Geofence Map          │ │  │
│  │  │ • Attendance    │   │  │ • Session Tracker       │ │  │
│  │  │   Submission    │   │  │ • Live Stats            │ │  │
│  │  │ • Assignment    │   │  └─────────────────────────┘ │  │
│  │  │   Card          │   │                              │  │
│  │  │ • Assessment    │   │                              │  │
│  │  │   Quiz          │   │                              │  │
│  │  └─────────────────┘   │                              │  │
│  └─────────────────────────┴──────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PWA Layer                                           │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ Service Worker (/public/sw.js)              │   │   │
│  │  │ • Offline caching strategy                  │   │   │
│  │  │ • Push event listeners                      │   │   │
│  │  │ • Notification click handlers                │   │   │
│  │  │ • Install/activate lifecycle                │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ Web App Manifest & Bootstrap                │   │   │
│  │  │ • Install prompt trigger                    │   │   │
│  │  │ • App metadata & icons                      │   │   │
│  │  │ • Offline fallback page                     │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Backend API Layer                                   │   │
│  │  Base: https://campusflow-backend.onrender.com      │   │
│  │  • Attendance management                            │   │
│  │  • Course & announcements                           │   │
│  │  • User authentication                              │   │
│  │  • Real-time SSE stream                             │   │
│  │  • Web Push subscriptions                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js App Router | 15.5.12 | React SSR + routing |
| **Runtime** | React | 19.1.1 | UI component library |
| **Language** | TypeScript | 5.x | Static typing |
| **Styling** | Tailwind CSS | 4.0.12 | Utility-first CSS |
| **State** | Zustand | 5.x | Global state management |
| **Data Fetching** | React Query (@tanstack) | 5.96.2 | Server state + caching |
| **Forms** | React Hook Form | 7.72 | Form state & validation |
| **Validation** | Zod | 4.3.6 | Schema validation |
| **HTTP** | Axios | 1.14.0 | HTTP client |
| **Animations** | Framer Motion | 12.23.12 | Page transitions |
| **Maps** | Leaflet + MapLibre | Latest | Geofence visualization |
| **Charts** | Recharts | 2.15.4 | Analytics graphs |
| **UI Primitives** | Radix UI | 1.x | Accessible components |
| **Icons** | Lucide React | 0.441.0 | Icon library |
| **Notifications** | Sonner | 2.0.7 | Toast notifications |
| **Notifications API** | Web Notifications | Native | Browser notifications |
| **Real-time** | EventSource | Native | Server-Sent Events |
| **PDF** | jsPDF + autotable | 3.0.2 | PDF generation |
| **Dev Tools** | ESLint + Prettier | Latest | Code quality |
| **Testing** | Node test runner | Native | Unit tests |

---

## 📁 Project Structure

```
CampusFlow-Frontend/
│
├── apps/
│   ├── student-portal/
│   │   ├── app/
│   │   │   ├── layout.tsx           # Root layout, PWA manifest link
│   │   │   ├── page.tsx             # Home/redirect
│   │   │   └── (auth)/              # Auth pages group
│   │   ├── public/
│   │   │   ├── manifest.webmanifest # PWA manifest
│   │   │   ├── sw.js                # Service Worker (shared)
│   │   │   └── offline.html         # Offline fallback
│   │   └── package.json
│   │
│   └── staff-portal/
│       ├── app/
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── public/
│       │   ├── manifest.webmanifest
│       │   └── ... (same PWA files)
│       └── package.json
│
├── src/
│   ├── api/
│   │   ├── client.ts               # Axios instance with interceptors
│   │   ├── auth.ts                 # Login, register, refresh endpoints
│   │   ├── student.ts              # Student API methods
│   │   ├── lecturer.ts             # Lecturer API methods
│   │   ├── shared.ts               # Shared endpoints
│   │   └── communication.ts        # Messaging APIs
│   │
│   ├── components/
│   │   ├── ui/                     # Reusable UI components
│   │   │   ├── button.tsx          # Button variants
│   │   │   ├── input.tsx           # Form input
│   │   │   ├── card.tsx            # Card container
│   │   │   ├── dialog.tsx          # Modal with custom close button
│   │   │   ├── data-table.tsx      # Sortable, paginated table
│   │   │   ├── sidebar.tsx         # Navigation drawer
│   │   │   ├── badge.tsx           # Status/tag badge
│   │   │   ├── breadcrumb.tsx      # Navigation breadcrumb
│   │   │   ├── empty-state.tsx     # No-data state
│   │   │   ├── skeleton.tsx        # Loading placeholder
│   │   │   ├── pagination.tsx      # Table pagination
│   │   │   ├── stat-card.tsx       # Dashboard stat card
│   │   │   ├── page-intro.tsx      # Page header
│   │   │   ├── file-uploader.tsx   # Drag-drop upload
│   │   │   ├── file-launcher.tsx   # File preview/download
│   │   │   ├── alert.tsx           # Alert/message box
│   │   │   └── ... (30+ components)
│   │   │
│   │   ├── providers/
│   │   │   ├── app-providers.tsx   # Root context setup
│   │   │   │                       # • QueryClientProvider
│   │   │   │                       # • AuthBootstrap
│   │   │   │                       # • Toaster
│   │   │   │                       # • PwaBootstrap
│   │   │   ├── pwa-bootstrap.tsx   # Service Worker registration
│   │   │   └── ...
│   │   │
│   │   └── app-sidebar.tsx         # Main navigation sidebar
│   │
│   ├── features/
│   │   ├── student/
│   │   │   ├── pages.tsx           # All student pages (1700+ lines)
│   │   │   │                       # • Dashboard
│   │   │   │                       # • Announcements (with SSE)
│   │   │   │                       # • Attendance submission
│   │   │   │                       # • Assignments
│   │   │   │                       # • Assessments
│   │   │   │                       # • Materials
│   │   │   ├── components/         # Feature-specific components
│   │   │   └── hooks/              # Feature-specific hooks
│   │   │
│   │   └── lecturer/
│   │       ├── attendance-page.tsx # Attendance dashboard
│   │       │                       # • Start session modal
│   │       │                       # • Geofence map preview
│   │       │                       # • Location capture
│   │       ├── announcements-page.tsx
│   │       └── components/
│   │
│   ├── lib/
│   │   ├── utils.ts                # Utility functions
│   │   ├── geolocation.ts          # GPS capture & location services
│   │   ├── reverse-geocode.ts      # Address lookup from coordinates
│   │   ├── constants.ts            # Constants: roles, routes, permissions
│   │   ├── push-notifications.ts   # Web Push + Notification API integration
│   │   └── staff-id.ts             # Staff ID validation utils
│   │
│   ├── store/
│   │   ├── auth-store.tsx          # Zustand auth state
│   │   │                           # • user, isAuthenticated
│   │   │                           # • login(), logout()
│   │   │                           # • localStorage persistence
│   │   └── ...other stores
│   │
│   ├── types/
│   │   └── domain.ts               # TypeScript interfaces
│   │                               # • User, Course, Announcement
│   │                               # • AttendanceSession, etc.
│   │
│   ├── utils/
│   │   ├── session-storage.ts      # JWT & session management
│   │   │                           # • getStoredSession()
│   │   │                           # • setStoredSession()
│   │   ├── auth-routing.ts         # Role-based page redirects
│   │   ├── error.ts                # Error message extraction
│   │   ├── fingerprint.ts          # Device fingerprinting
│   │   ├── format.ts               # Date, currency, number formatting
│   │   ├── assessment.ts           # Assessment utilities
│   │   └── live-stream.ts          # Video/WebSocket helpers
│   │
│   └── hooks/
│       └── use-mobile.ts           # Mobile viewport detection hook
│
├── public/
│   ├── sw.js                       # Service Worker
│   │                               # • Install/activate lifecycle
│   │                               # • Push event handling
│   │                               # • Fetch/offline caching
│   ├── offline.html                # Offline fallback page
│   ├── manifest.webmanifest        # Root PWA manifest (symlink)
│   ├── apple-touch-icon.png        # iOS home screen icon
│   ├── favicon.ico & favicon.svg   # Browser icon
│   └── images/                     # Static assets
│
├── components.json                 # Radix UI component config
├── middleware.ts                   # Next.js middleware
│                                   # • Auth redirects
│                                   # • Token refresh checks
├── next.config.mjs                 # Next.js config
│                                   # • Turbopack setup
│                                   # • Image optimization
├── tsconfig.json                   # TypeScript paths + strict mode
├── postcss.config.mjs              # Tailwind + PostCSS
├── .eslintrc.json                  # ESLint rules
├── .prettierrc                      # Prettier formatting
├── package.json                    # Root workspace manifest
├── README.md                       # Old README
└── README_COMPREHENSIVE.md         # This file
│
└── tests/
    ├── access.test.ts              # RBAC tests
    ├── auth-routing.test.ts        # Navigation tests
    ├── assessment-utils.test.ts    # Utility tests
    └── staff-id.test.ts            # Staff ID validation tests
```

---

## ✨ Key Features

### 1. **Dual Portal Architecture**

**Student Portal** (`/student/*`)
- Dashboard with enrollment status, recent activity
- Submit attendance with GPS geofence validation
- View assignments and submit files
- Take online assessments with progress tracking
- Real-time announcements + enable push notifications
- Account profile and settings
- Responsive mobile-first design

**Staff Portal** (`/lecturer/*` or `/staff/*`)
- Attendance dashboard with live session map
- Start geofence sessions with configurable radius
- Publish announcements with SSE real-time delivery
- Manage courses and enrollments
- Create and distribute assignments
- View analytics (attendance, engagement)

### 2. **Real-time Announcement System**

**Immediate SSE** (browser open):
- EventSource streams announcements as they're published
- Show toast notification in-page instantly
- Automatic cache invalidation to refetch list
- Fallback polling (10s) if SSE unavailable

**Web Push** (browser closed):
- Service worker receives push notification
- Display as OS notification
- Click opens browser and navigates to announcement

**Architecture**:
```
Lecturer publishes
    ↓
Backend broadcasts to SSE clients → In-page toast (immediate)
                    ↓
                 Store subscriptions → Service worker push (background)
```

### 3. **Geofence-based Attendance**

- **GPS Capture**: Real-time location with accuracy reporting
- **Reverse Geocoding**: Auto-detect building/room from coordinates
- **Visual Map**: Leaflet/MapLibre showing session geofence + student markers
- **Validation**: Only accept submissions within configurable radius
- **Session QR Code**: Quick enrollment via QR scan
- **Live Tracking**: Lecturer sees all present students on map

### 4. **Progressive Web App (PWA)**

- **Installability**: One-click install button in Chrome address bar
- **Home Screen**: Add to home screen on mobile (like native app)
- **Offline Support**: Service worker caches critical routes
- **Background Sync**: Queue actions when offline, replay when online
- **Push Notifications**: Web Push + Notification API
- **Install Shortcuts**: Quick access to key features

### 5. **Authentication & Authorization**

- **JWT Tokens**: Short-lived access (15m) + refresh (7d)
- **Role-based Routing**: Automatic redirects based on role
- **Session Persistence**: localStorage + Zustand store
- **Auto Token Refresh**: Transparent refresh on 401
- **Device Fingerprinting**: Browser-based device tracking
- **Logout**: Clear session everywhere (cross-tab)

### 6. **Data Management**

- **React Query**: Automatic caching, refetches, mutations
- **Zustand**: Lightweight global state for auth
- **Form Validation**: React Hook Form + Zod schemas
- **Optimistic Updates**: Instant UI feedback
- **Error Handling**: User-friendly error messages
- **Loading States**: Skeleton screens during fetch

### 7. **UI/UX Excellence**

- **Responsive**: Mobile-first Tailwind CSS (sm, md, lg, xl)
- **Animations**: Framer Motion page transitions
- **Accessibility**: Radix UI primitives, ARIA labels
- **Dark Mode**: Next Themes (ready for toggle)
- **Notifications**: Toast + browser notifications
- **Mobile Gestures**: Touch-friendly modals, drag interactions
- **Loading Feedback**: Skeletons, spinners, progress bars

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** ≥ 18.x (recommend 22.x+)
- **npm** ≥ 9.x or **yarn**
- **Git** configured
- **Backend Running**: `http://localhost:4000` (for dev)

### 1. Clone Repository

```bash
git clone https://github.com/OJAYcode/CampusFlow.git
cd CampusFlow-Frontend
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create `.env.local` at root:

```env
# Backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1

# For production (Vercel):
# NEXT_PUBLIC_API_BASE_URL=https://campusflow-backend.onrender.com/api/v1

# Google Maps (for reverse geocoding)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Map Tiles
NEXT_PUBLIC_MAP_TILES_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
NEXT_PUBLIC_MAP_ATTRIBUTION=© OpenStreetMap contributors
```

### 4. Start Development Servers

```bash
# Run both portals in parallel (default dev command)
npm run dev
# Opens http://localhost:3000 (student-portal)

# Or run specific portal
npm run dev:student   # Student portal on 3000
npm run dev:staff     # Staff portal on 3001 (if configured)
```

### 5. Login Credentials (Test Accounts)

After seeding backend database:

**Student**:
- Email: `student@example.com`
- Password: `password123`

**Lecturer**:
- Email: `lecturer@example.com`
- Password: `password123`

---

## 👨‍💻 Development

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes & test locally
npm run dev

# 3. Run linting & tests
npm run lint
npm test

# 4. Commit & push
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature

# 5. Create pull request on GitHub
```

### Code Style & Conventions

**TypeScript Strict Mode**
- No implicit `any` types
- Interfaces for exported types
- Proper error handling with try-catch

**File Naming**
- Components: `PascalCase.tsx` (StudentDashboard.tsx)
- Utilities: `camelCase.ts` (useStudentData.ts)
- Styles: Tailwind inline (no .css files)

**Import Organization** (auto-sorted by ESLint)
```typescript
import React from 'react';                    // External
import { QueryClient } from '@tanstack/react-query'; // External packages
import { Button } from '@/components/ui/button';      // Internal @/ paths
import { studentApi } from '@/src/api/student';       // API
import { useIsMobile } from '@/hooks/use-mobile';     // Hooks
import { formatDate } from '@/src/utils/format';      // Utils
```

### Common Development Tasks

#### Add New API Endpoint

1. **Create method** in `src/api/[domain].ts`:
```typescript
export const studentApi = {
  announcements: () => apiClient.get('/announcements'),
  submitAnnouncement: (data: { title: string; body: string }) =>
    apiClient.post('/announcements', data),
};
```

2. **Define type** in `src/types/domain.ts`:
```typescript
export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}
```

3. **Use in component**:
```typescript
const { data: announcements } = useQuery({
  queryKey: ['student', 'announcements'],
  queryFn: studentApi.announcements,
  staleTime: 60_000,
});
```

#### Create New Component

1. **Create file** in `src/components/ui/my-component.tsx`:
```typescript
export interface MyComponentProps {
  title: string;
  variant?: 'primary' | 'secondary';
}

export function MyComponent({ title, variant = 'primary' }: MyComponentProps) {
  return <div className={`my-component my-component--${variant}`}>{title}</div>;
}
```

2. **Export from index** (if needed):
```typescript
// src/components/ui/index.ts
export { MyComponent } from './my-component';
export type { MyComponentProps } from './my-component';
```

#### Add Protected Route

```typescript
// app/student/my-page/page.tsx
'use client';
import { useAuthStore } from '@/src/store/auth-store';

export default function MyPage() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || user?.role !== 'student') {
    return <div>Access Denied</div>;
  }

  return <div>Protected content for {user?.fullName}</div>;
}
```

#### Debug API Calls

```typescript
// Add to src/api/client.ts interceptor
apiClient.interceptors.request.use(config => {
  console.log('API Request:', config.method?.toUpperCase(), config.url);
  return config;
});

apiClient.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  error => {
    console.error('API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);
```

### Running Tests

```bash
npm test                 # Run all tests
npm test -- --watch     # Watch mode (re-run on changes)
npm test -- --coverage  # Coverage report
```

### Linting & Formatting

```bash
npm run lint            # Check for errors
npm run lint -- --fix   # Auto-fix issues

npx prettier --write .  # Format all files
```

---

## 📦 Build & Deployment

### Local Production Build

```bash
npm run build

# Verify build succeeded
npm run start
# Opens http://localhost:3000
```

### Vercel Deployment

#### First Time Setup

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial setup"
git push origin main
```

2. **Link Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New..." → "Project"
   - Import from GitHub → Select `CampusFlow`
   - Vercel auto-detects monorepo

3. **Configure Build Settings**
   - **Framework**: Next.js (auto-detected)
   - **Root Directory**: Leave blank (monorepo detected)
   - **Build Command**: `npm run build` (auto-set)
   - **Output Directory**: `.next` (auto-set)

4. **Add Environment Variables**
   - Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - Click Deploy

#### Set Up Two Vercel Projects (for two portals)

If you want separate deployments for student & staff portals:

1. **Create Project 1** (Student Portal)
   - Root Directory: `apps/student-portal`
   - Deploy

2. **Create Project 2** (Staff Portal)
   - Root Directory: `apps/staff-portal`
   - Deploy

#### Auto-Deploy on Git Push

- Vercel auto-deploys when you push to `main`
- Check status in Vercel dashboard
- Rollback if needed

#### Preview Deployments

- Vercel auto-creates preview for each PR
- Share preview link with team for review

### Build Optimization

- **Code Splitting**: Next.js automatic per-route chunks
- **Image Optimization**: `next/image` auto-resizes
- **CSS Purge**: Tailwind removes unused classes
- **Tree Shaking**: Unused exports removed
- **Bundle Analysis**:
  ```bash
  npm run build -- --analyze
  ```

---

## 🧩 Components & Hooks

### Key UI Components

#### Button
```typescript
import { Button } from '@/components/ui/button';

<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button disabled>Disabled</Button>
```

#### Input
```typescript
import { Input } from '@/components/ui/input';

<Input
  placeholder="Enter email"
  type="email"
  value={email}
  onChange={e => setEmail(e.target.value)}
/>
```

#### Card
```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>My Card</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

#### Dialog
```typescript
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogTitle>Modal Title</DialogTitle>
    <p>Modal content</p>
  </DialogContent>
</Dialog>
```

### Custom Hooks

#### useIsMobile
```typescript
import { useIsMobile } from '@/hooks/use-mobile';

export function MyComponent() {
  const isMobile = useIsMobile();
  
  return (
    <div>
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  );
}
```

#### useAuthStore
```typescript
import { useAuthStore } from '@/src/store/auth-store';

export function Profile() {
  const { user, logout } = useAuthStore();
  
  return (
    <div>
      <p>Hello, {user?.fullName}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

#### useQuery (React Query)
```typescript
import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/src/api/student';

export function AnnouncementsList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['student', 'announcements'],
    queryFn: studentApi.announcements,
    staleTime: 60_000,        // Cache for 1 minute
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.data?.map(announcement => (
        <li key={announcement.id}>{announcement.title}</li>
      ))}
    </ul>
  );
}
```

---

## 🔌 API Integration

### HTTP Client Setup

```typescript
// src/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,  // Send cookies
});

// Request interceptor: Attach JWT
apiClient.interceptors.request.use(config => {
  const { accessToken } = getStoredSession();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: Handle 401
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Clear session & redirect to login
      clearStoredSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### API Methods Pattern

```typescript
// src/api/student.ts
export const studentApi = {
  profile: () => apiClient.get('/students/profile'),
  announcements: () => apiClient.get('/announcements'),
  assignments: () => apiClient.get('/assignments'),
  submitAttendance: (sessionId: string, lat: number, lng: number) =>
    apiClient.post(`/sessions/${sessionId}/attendance`, { lat, lng }),
};
```

### Error Handling

```typescript
import { getErrorMessage } from '@/src/utils/error';
import { toast } from 'sonner';

try {
  await studentApi.submitAttendance(sessionId, lat, lng);
  toast.success('Attendance submitted');
} catch (error) {
  const msg = getErrorMessage(error);
  toast.error(msg);
  console.error('Submit error:', error);
}
```

---

## 🔐 Authentication

### Login Flow

```typescript
// Step 1: Get credentials from form
const { email, password } = formData;

// Step 2: Call backend
const response = await authApi.loginStudent({ email, password });

// Step 3: Store session
setStoredSession(response.data.accessToken, response.data.user);

// Step 4: Update auth store
useAuthStore.setState({
  user: response.data.user,
  isAuthenticated: true,
});

// Step 5: Redirect
router.push('/student/dashboard');
```

### Session Management

**Storage** (`src/utils/session-storage.ts`):
```typescript
export function getStoredSession() {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem('auth_session');
  return stored ? JSON.parse(stored) : {};
}

export function setStoredSession(accessToken: string, user: User) {
  localStorage.setItem('auth_session', JSON.stringify({ accessToken, user }));
}

export function clearStoredSession() {
  localStorage.removeItem('auth_session');
}
```

### Protected Routes

Routes automatically check `useAuthStore` for auth state. Middleware can handle redirects:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token && request.nextUrl.pathname.startsWith('/student')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/lecturer/:path*'],
};
```

---

## ⚡ Real-time Features

### SSE Announcements

**Subscribe** (in StudentAnnouncementsPage):
```typescript
useEffect(() => {
  if (!notificationsEnabled) return;

  const { accessToken } = getStoredSession();
  const eventSource = new EventSource(
    `${apiClient.defaults.baseURL}/notifications/stream?token=${accessToken}`,
    { withCredentials: true }
  );

  eventSource.addEventListener('announcement', (event: MessageEvent) => {
    try {
      const announcement = JSON.parse(event.data);
      toast.success(`New: ${announcement.title}`);
      queryClient.invalidateQueries({ queryKey: ['student', 'announcements'] });
    } catch (e) {}
  });

  eventSource.addEventListener('heartbeat', () => {
    // Keep-alive
  });

  eventSource.onerror = () => {
    try { eventSource.close(); } catch {}
    // Fallback to polling...
  };

  return () => eventSource.close();
}, [notificationsEnabled]);
```

### Web Push Notifications

**Enable Push**:
```typescript
import { requestPushNotifications } from '@/src/lib/push-notifications';

const result = await requestPushNotifications('student');
if (result.enabled) {
  toast.success('Push notifications enabled');
  // Now:
  // 1. Service worker registered
  // 2. PushManager subscription created
  // 3. Subscription sent to backend
}
```

**Service Worker Handling** (`public/sw.js`):
```javascript
self.addEventListener('push', function (event) {
  const data = event.data?.json() || {};
  const title = data.title || 'CampusFlow';
  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clients => {
      for (let client of clients) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
```

---

## 📲 PWA Setup

### Manifest Configuration

**Student Portal** (`apps/student-portal/public/manifest.webmanifest`):
```json
{
  "name": "CampusFlow Student Portal",
  "short_name": "CampusFlow",
  "description": "Attendance, coursework, and academic management",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Attendance",
      "short_name": "Attendance",
      "url": "/student/attendance",
      "icons": [{ "src": "/icons/icon-192.png", "sizes": "192x192" }]
    }
  ]
}
```

### Service Worker Lifecycle

```javascript
// Install: Cache critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('campusflow-v1').then(cache => {
      return cache.addAll([
        '/',
        '/offline.html',
        '/sw.js',
      ]);
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== 'campusflow-v1') {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first strategy
self.addEventListener('fetch', event => {
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then(response =>
          response || caches.match('/offline.html')
        )
      )
    );
  }
});
```

### Installation Trigger

The install button appears in Chrome when:
- ✅ Manifest is valid & linked
- ✅ Service Worker registered & active
- ✅ HTTPS enabled (or localhost in dev)
- ✅ Icon ≥ 192px available

---

## 🧪 Testing

### Test Files Location
```
tests/
├── access.test.ts           # RBAC tests
├── auth-routing.test.ts     # Navigation
├── assessment-utils.test.ts # Utilities
└── staff-id.test.ts         # Staff ID validation
```

### Running Tests

```bash
npm test                 # Run all
npm test -- --watch     # Watch mode
npm test -- --coverage  # Coverage report
```

### Example Test

```typescript
// tests/auth-routing.test.ts
import { test, describe, assert } from 'node:test';
import { getLogoutRedirect } from '@/src/utils/auth-routing';

describe('Auth Routing', () => {
  test('Student redirects to /student/dashboard', () => {
    const url = getLogoutRedirect('student');
    assert.equal(url, '/student/dashboard');
  });

  test('Lecturer redirects to /lecturer/dashboard', () => {
    const url = getLogoutRedirect('lecturer');
    assert.equal(url, '/lecturer/dashboard');
  });
});
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@/src/api/client'"

**Solution:**
- Check `tsconfig.json` has correct paths:
  ```json
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": { "@/*": ["./*"] }
    }
  }
  ```
- Restart TypeScript server: Cmd/Ctrl + Shift + P → TypeScript: Restart TS Server

### Issue: API 401 Unauthorized

**Solution:**
```typescript
// Check token
console.log(getStoredSession());

// Verify backend running
curl http://localhost:4000/api/v1/students/profile

// Check .env.local has correct API URL
echo $NEXT_PUBLIC_API_BASE_URL
```

### Issue: "Cannot resolve 'fs' in Service Worker"

**Solution:**
- `/public/sw.js` runs in browser, NOT Node.js
- Remove `fs`, `path`, `crypto` imports
- Use Fetch API instead of Node APIs

### Issue: Tailwind Classes Not Applied

**Solution:**
```bash
# Verify Tailwind config includes src/
# In tailwind.config.js:
content: ['./src/**/*.{js,ts,jsx,tsx}', './apps/**/*.{js,ts,jsx,tsx}']

# Rebuild
npm run build

# Hard refresh
Ctrl + Shift + R (or Cmd + Shift + R on Mac)
```

### Issue: "Query cache not invalidating"

**Solution:**
```typescript
// WRONG: Different query key
useQuery({ queryKey: ['students', 'announcements'] })
invalidateQueries({ queryKey: ['student', 'announcements'] })

// CORRECT: Exact match
useQuery({ queryKey: ['student', 'announcements'] })
invalidateQueries({ queryKey: ['student', 'announcements'] })

// Or use partial match
invalidateQueries({ queryKey: ['student'] }) // Invalidates all student queries
```

### Issue: ServiceWorker Registration Failed

**Solution:**
- Only HTTPS (or `localhost:3000`)
- Check `/public/sw.js` for syntax errors
- Browser DevTools → Application → Service Workers
- Clear site data: Settings → Privacy → Clear browsing data

---

## 📄 License

MIT License – See LICENSE.md

---

**Last Updated**: May 8, 2026  
**Maintained by**: CampusFlow Team  
**Repository**: https://github.com/OJAYcode/CampusFlow
