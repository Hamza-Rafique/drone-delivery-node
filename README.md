## Submit Order

```bash
POST /api/orders
Authorization: Bearer <token>

{
  "origin": { "lat": 26.2285, "lng": 50.5860 },
  "destination": { "lat": 26.2500, "lng": 50.6100 }
}

```

## Withdraw Order

```bash
DELETE /api/orders/ORDER_ID
Authorization: Bearer <token>
```
## Get My Orders
```bash
GET /api/orders/user/me
Authorization: Bearer <token>
```