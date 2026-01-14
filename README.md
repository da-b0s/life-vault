# LifeVault

LifeVault is a non-custodial inheritance and savings protocol built on Arbitrum Sepolia using Arbitrum Stylus (Rust).

It addresses two core issues in asset management: preventing premature liquidation of savings (Diamond Hands) and ensuring asset continuity in the event of loss of access or death (Legacy Protocol).

## Features

### 1. Diamond Vault (Time-Locked Savings)
Users lock ETH for a pre-defined duration to enforce disciplined saving.
* **Lock Mechanism:** Funds are locked until the maturity date.
* **Emergency Withdrawal:** Users can break the lock early but incur a penalty.
    * 5% penalty if more than 24 hours remain.
    * 1% penalty if less than 24 hours remain.
* **Revenue:** Penalties are programmatically sent to the protocol developer wallet.

### 2. Legacy Protocol (Inheritance)
A "Dead Man's Switch" mechanism for asset transfer.
* **Configuration:** Users set an inactivity threshold (e.g., 180 days) and a beneficiary address.
* **Proof of Life:** The owner can "Ping" the contract to reset the inactivity timer.
* **Claiming:** If the timer expires, the specific beneficiary can locate and claim the funds.
* **Shareable Links:** Deep-linking support allows beneficiaries to easily access the claim interface without manually searching for wallet addresses.

## Technical Architecture

This project is a monorepo containing the smart contract and the frontend interface.

### Smart Contract (`/life-vault`)
* **Language:** Rust
* **SDK:** Arbitrum Stylus
* **Optimization:** Uses manual storage slot management to recycle Vault IDs (0-4), ensuring efficient storage usage and preventing storage bloat.

### Frontend (`/life-vault-ui`)
* **Framework:** Next.js 14 (App Router)
* **Styling:** TailwindCSS
* **Blockchain Interaction:** Wagmi v2, Viem, RainbowKit
* **Deployment:** Vercel

## Deployed Contracts

**Arbitrum Sepolia Testnet:**
`0xA1C65aae77B7b052B07E473E9dD6F749093d223A`

## Local Development

### Prerequisites
* Rust & Cargo (with `wasm32-unknown-unknown` target)
* Node.js v18+
* Arbitrum Stylus CLI (`cargo install cargo-stylus`)

### 1. Smart Contract
To build and check the Rust contract:

```bash
cd life-vault
cargo stylus check
```

To deploy (requires private key)

```bash
cd life-vault-ui
npm install
npm run dev
```

### 2. Frontend Interface
To run the UI locally:

```bash

cd life-vault-ui
npm install
npm run dev
Open http://localhost:3000 to view the application.
```

