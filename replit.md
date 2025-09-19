# GmailMarket - Secure Gmail Account Marketplace

## Overview

GmailMarket is a secure web marketplace for buying and selling Gmail accounts. The platform provides a structured environment where sellers can list Gmail accounts in various categories while buyers can purchase them with confidence through a verification system. The application features real-time transactions, dispute resolution, user authentication via Replit Auth, and a modern React-based frontend with a Node.js/Express backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Express sessions with PostgreSQL store (connect-pg-simple)
- **Development**: Hot module replacement with Vite in development mode
- **Build Process**: ESBuild for server-side bundling, Vite for client-side bundling

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Key Tables**:
  - Users (with balance tracking and Stripe integration)
  - Categories (predefined Gmail account types with fixed pricing)
  - Gmail Accounts (inventory with seller associations)
  - Transactions (purchase records with verification status)
  - Disputes (issue tracking system)
  - Sessions (for authentication persistence)

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Security**: HTTP-only secure cookies with CSRF protection
- **User Management**: Automatic user creation/updates on authentication

### External Dependencies

- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit OpenID Connect service
- **Payment Processing**: Stripe integration (customer and subscription management)
- **Email Service**: Gmail API integration for account verification
- **Development Tools**: Replit runtime environment with cartographer plugin
- **UI Framework**: Radix UI primitives for accessible components
- **WebSocket**: For real-time database connections in Neon environment