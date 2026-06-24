# Transaction API Contract
> **Optimized for Jules (Frontend Engineer)**

This document outlines the strict API contract for the new Transactions feature. It details the payload structures, strict property types, required paths, and outlines the two-step verification deletion flow.

---

## 1. Create a Transaction

Create a new transaction and automatically update the corresponding `Book` (and `Category` if provided).

**Endpoint:** `POST /api/v1/transactions`
**Auth:** Required (Session Cookie / Headers)

### Request Payload

```json
{
  "name": "Salary",           // string, required (min length 1)
  "amount": 2500.00,          // number, required (positive)
  "type": "credit",           // string enum, required: "credit" | "debit"
  "bookId": "UUID-STRING",    // string, required (valid UUID)
  "categoryId": 1             // number, optional/nullable
}
```

### Mock Response

**201 Created**
```json
{
  "message": "Transaction created successfully"
}
```

**400 Bad Request** (Validation Error)
```json
{
  "error": "Amount must be positive"
}
```

---

## 2. Update a Transaction

Update an existing transaction. The backend will automatically reverse the mathematical history of the previous transaction state and apply the new metrics to the `Book` and `Category`.

**Endpoint:** `PUT /api/v1/transactions/:id`
**Auth:** Required (Session Cookie / Headers)

### Request Payload

```json
{
  "name": "Adjusted Salary",  // string, required
  "amount": 2600.00,          // number, required (positive)
  "type": "credit",           // string enum, required: "credit" | "debit"
  "bookId": "UUID-STRING",    // string, required (valid UUID)
  "categoryId": 1             // number, optional/nullable
}
```

### Mock Response

**200 OK**
```json
{
  "message": "Transaction updated successfully"
}
```

---

## 3. Two-Step Verification Deletion System

To prevent accidental destruction of financial records, deletions require a secure 2-step flow.

### Phase 1: Request Deletion Token

Request a time-sensitive 6-character token to authorize the deletion. The token is valid for 5 minutes (300 seconds).

**Endpoint:** `POST /api/v1/transactions/:id/delete/request`
**Auth:** Required

**Request Payload:** None

### Mock Response

**200 OK**
```json
{
  "token": "K9F2W4"
}
```

*(Jules: Store this token in the UI state and present the verification challenge to the user.)*

---

### Phase 2: Execute Deletion

Submit the acquired token to permanently delete the transaction. The backend will reverse the transaction's financial impact before erasing the record.

**Endpoint:** `DELETE /api/v1/transactions/:id`
**Auth:** Required

### Request Payload

```json
{
  "token": "K9F2W4"  // string, required (exactly 6 characters)
}
```

### Mock Response

**200 OK**
```json
{
  "message": "Transaction deleted successfully"
}
```

**400 Bad Request**
```json
{
  "error": "Invalid token format"
}
```

**401 Unauthorized** (Token mismatched or expired)
```json
{
  "error": "Invalid or expired token"
}
```

---
