# Wallet API Service

This service provides:

- **User authentication** (register & login).
- **Wallet creation** with encrypted private keys & mnemonics.
- **Transactions** (send & receive).
- **Balance checks** (using wallet address or phone number).
- **Transaction history** (via Covalent API).

---

## **Requirements**

- Node.js 18+
- MySQL/Postgres (with Sequelize models)
- Environment variables:

```bash
PORT=3000
JWT_SECRET=your_jwt_secret
ENCRYPTION_SECRET=your_encryption_secret
COVALENT_API_KEY=your_covalent_api_key

```

---

## **Authentication Endpoints**

### **1. Register User**

**POST** `http://localhost:3000/api/auth/register`

**Request Body**

```json
{
  "name": "Moses",
  "phone": "+2348101234567",
  "email": "moses@example.com",
  "password": "password123"
}
```

**Response**

```json
{
  "message": "User registered",
  "token": "jwt_token_here",
  "wallet": {
    "address": "0x123...",
    "mnemonic": "sample twelve words...",
    "encrypted_private_key": "iv:encrypted",
    "encrypted_mnemonic": "iv:encrypted"
  }
}
```

---

### **2. Login User**

**POST** `http://localhost:3000/api/auth/login`

**Request Body**

```json
{
  "phone": "+2348101234567",
  "password": "password123"
}
```

**Response**

```json
{
  "message": "Login successful",
  "token": "jwt_token_here"
}
```

---

## **Wallet Endpoints**

### **3. Get Wallet Balance**

**POST** `http://localhost:3000/api/wallet/balance`

**Request Body**

```json
{
  "identifier": "+2348101234567",
  "network": "bsc"
}
```

**Response**

```json
{
  "identifier": "+2348101234567",
  "network": "bsc",
  "balance": "0.045"
}
```

---

### **4. Send Transaction**

**POST** `http://localhost:3000/api/wallet/send`

**Request Body**

```json
{
  "sender": "+2348101234567",
  "recipient": "0xRecipientWalletAddress",
  "amount": "0.01",
  "network": "bsc"
}
```

**Response**

```json
{
  "txHash": "0xabc123..."
}
```

---

### **5. Get Transaction History**

**GET** `http://localhost:3000/api/wallet/history?identifier=+2348101234567&network=bsc`

**Response**

```json
{
  "success": true,
  "data": [
    {
      "total_transactions": 12,
      "total_transfers": 8,
      "earliest_transaction": {
        "tx_hash": "0xabcdef123...",
        "block_signed_at": "2025-07-20T08:00:00Z",
        "tx_detail_link": "https://bscscan.com/tx/0xabcdef123..."
      },
      "latest_transaction": {
        "tx_hash": "0x123456789...",
        "block_signed_at": "2025-07-25T12:30:00Z"
      },
      "gas_summary": {
        "total_sent_count": 12,
        "total_fees_paid": "0.0345",
        "total_gas_quote": "0.02",
        "average_gas_quote_per_tx": "0.0016",
        "gas_metadata": {}
      }
    }
  ]
}
```

---

## **Quick Start**

```bash
npm install
npm run dev
```

Then test the endpoints using Postman or cURL.

---

## **Importing Postman Collection**

1. Open Postman.
2. Click **Import** > **File**.
3. Select `wallet-api.postman_collection.json`.
4. Replace `{{token}}` with the JWT returned from the login endpoint.

---
