# Drone Delivery Management Backend

A scalable backend system for managing drone deliveries with real-time tracking.

## Features

- **JWT Authentication** for admin, enduser, and drone users
- **Real-time tracking** using WebSocket
- **Drone management** with heartbeat monitoring
- **Order management** with status updates
- **Handoff system** for broken drones
- **Admin dashboard** with monitoring capabilities

## Tech Stack

- **Node.js** with **TypeScript**
- **Express.js** REST API
- **PostgreSQL** with **Prisma ORM**
- **Redis** for caching and pub/sub
- **Socket.IO** for real-time communication
- **Docker** for containerization
- **Jest** for testing

## Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 15
- Redis 7

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Hamza-Rafique/drone-delivery-nodejs.git
cd drone-delivery-nodejs
```