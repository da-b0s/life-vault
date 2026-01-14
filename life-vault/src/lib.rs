#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use stylus_sdk::{
    alloy_primitives::{address, Address, U256, U8}, // Added 'address' macro import
    alloy_sol_types::sol,
    block,
    prelude::*,
    evm,
    msg,
    storage::{StorageAddress, StorageBool, StorageMap, StorageU256, StorageU8},
};

// --- EVENTS ---
sol! {
    event VaultCreated(address indexed user, uint8 vault_id, uint8 vault_type, uint256 amount);
    event Withdrawn(address indexed user, uint8 vault_id, uint256 amount, uint256 penalty);
    event Pinged(address indexed user, uint8 vault_id, uint256 time);
    event DevFeePaid(address indexed dev, uint256 amount);
}

// --- STORAGE ---
#[storage]
#[entrypoint]
pub struct LifeVault {
    pub vault_counts: StorageMap<Address, StorageU8>,
    pub vault_types: StorageMap<Address, StorageMap<u8, StorageU8>>,
    pub vault_active: StorageMap<Address, StorageMap<u8, StorageBool>>,
    pub vault_amounts: StorageMap<Address, StorageMap<u8, StorageU256>>,
    pub vault_timers: StorageMap<Address, StorageMap<u8, StorageU256>>,
    pub vault_last_seen: StorageMap<Address, StorageMap<u8, StorageU256>>,
    pub vault_beneficiaries: StorageMap<Address, StorageMap<u8, StorageAddress>>,
}

// --- CONFIG ---
//  YOUR WALLET IS NOW LOCKED IN SAFELY
const DEV_WALLET: Address = address!("A5bB2f7B5C398186d390A0d264AB8C8C0bBd22Ea"); 

#[public]
impl LifeVault {
    
    // --- CREATE VAULT ---
    #[payable]
    #[allow(non_snake_case)]
    pub fn createVault(&mut self, vault_type: u8, config_time: U256, beneficiary: Address) -> Result<(), Vec<u8>> {
        let user = msg::sender();
        
        // 1. FIND FIRST EMPTY SLOT (0-4)
        let mut vault_id = 0u8;
        let mut found_slot = false;

        // Explicit cast to u8 in the loop to prevent type confusion
        for i in 0u8..5u8 {
            if !self.vault_active.get(user).get(i) {
                vault_id = i;
                found_slot = true;
                break;
            }
        }

        if !found_slot {
            return Err(b"Max 5 active vaults allowed".to_vec());
        }

        let amount = msg::value();
        if amount == U256::ZERO {
            return Err(b"Must deposit ETH".to_vec());
        }

        // Setters
        self.vault_active.setter(user).setter(vault_id).set(true);
        self.vault_types.setter(user).setter(vault_id).set(U8::from(vault_type)); 
        self.vault_amounts.setter(user).setter(vault_id).set(amount);
        self.vault_timers.setter(user).setter(vault_id).set(config_time);
        self.vault_beneficiaries.setter(user).setter(vault_id).set(beneficiary);
        
        if vault_type == 1 {
            self.vault_last_seen.setter(user).setter(vault_id).set(U256::from(block::timestamp()));
        }

        // Update max count history
        let current_max = self.vault_counts.get(user).to();
        if vault_id >= current_max {
             self.vault_counts.setter(user).set(U8::from(vault_id + 1));
        }

        evm::log(VaultCreated {
            user,
            vault_id,
            vault_type,
            amount,
        });

        Ok(())
    }

    // --- WITHDRAW ---
    #[allow(non_snake_case)]
    pub fn withdraw(&mut self, vault_id: u8) -> Result<(), Vec<u8>> {
        let user = msg::sender();
        
        if !self.vault_active.get(user).get(vault_id) {
             return Err(b"Vault inactive".to_vec());
        }
        
        if self.vault_types.get(user).get(vault_id) != U8::from(0) {
             return Err(b"Not a Diamond vault".to_vec());
        }

        let amount = self.vault_amounts.get(user).get(vault_id);
        let unlock_time = self.vault_timers.get(user).get(vault_id);
        let now = U256::from(block::timestamp());

        let mut amount_to_send = amount;
        let mut penalty = U256::ZERO;

        // 2. CALCULATE PENALTY
        if now < unlock_time {
            let time_left = unlock_time - now;
            let one_day = U256::from(86400);
            let penalty_bps = if time_left > one_day { U256::from(5) } else { U256::from(1) };
            
            penalty = (amount * penalty_bps) / U256::from(100);
            amount_to_send = amount - penalty;
        }

        self.vault_active.setter(user).setter(vault_id).set(false);
        self.vault_amounts.setter(user).setter(vault_id).set(U256::ZERO);

        let _ = stylus_sdk::call::transfer_eth(user, amount_to_send);

        // 4. SEND PENALTY TO DEV (Safe Transfer)
        if penalty > U256::ZERO {
            if !DEV_WALLET.is_zero() {
                 let _ = stylus_sdk::call::transfer_eth(DEV_WALLET, penalty);
                 evm::log(DevFeePaid { dev: DEV_WALLET, amount: penalty });
            }
        }

        evm::log(Withdrawn {
            user,
            vault_id,
            amount: amount_to_send,
            penalty
        });

        Ok(())
    }

    // --- PING ---
    #[allow(non_snake_case)]
    pub fn ping(&mut self, vault_id: u8) -> Result<(), Vec<u8>> {
        let user = msg::sender();
        if !self.vault_active.get(user).get(vault_id) { return Err(b"Vault inactive".to_vec()); }
        if self.vault_types.get(user).get(vault_id) != U8::from(1) { return Err(b"Not Legacy".to_vec()); }

        self.vault_last_seen.setter(user).setter(vault_id).set(U256::from(block::timestamp()));
        evm::log(Pinged { user, vault_id, time: U256::from(block::timestamp()) });
        Ok(())
    }

    // --- CLAIM LEGACY ---
    #[allow(non_snake_case)]
    pub fn claimLegacy(&mut self, owner: Address, vault_id: u8) -> Result<(), Vec<u8>> {
        let caller = msg::sender();
        if !self.vault_active.get(owner).get(vault_id) { return Err(b"Vault inactive".to_vec()); }
        if self.vault_types.get(owner).get(vault_id) != U8::from(1) { return Err(b"Not Legacy".to_vec()); }

        let bene_bytes = self.vault_beneficiaries.get(owner).get(vault_id);
        let beneficiary = Address::from(bene_bytes);
        if caller != beneficiary { return Err(b"Not beneficiary".to_vec()); }

        let last_seen = self.vault_last_seen.get(owner).get(vault_id);
        let max_inactivity = self.vault_timers.get(owner).get(vault_id);
        let now = U256::from(block::timestamp());

        if now < last_seen + max_inactivity { return Err(b"Owner is still active".to_vec()); }

        let amount = self.vault_amounts.get(owner).get(vault_id);
        self.vault_active.setter(owner).setter(vault_id).set(false);
        self.vault_amounts.setter(owner).setter(vault_id).set(U256::ZERO);

        let _ = stylus_sdk::call::transfer_eth(beneficiary, amount);
        Ok(())
    }

    // --- VIEW FUNCTIONS ---
    #[allow(non_snake_case)]
    pub fn getVaultData(&self, user: Address, vault_id: u8) -> Result<(bool, u8, U256, U256, U256, Address), Vec<u8>> {
        let active = self.vault_active.get(user).get(vault_id);
        let v_type_u8 = self.vault_types.get(user).get(vault_id);
        let amount = self.vault_amounts.get(user).get(vault_id);
        let timer = self.vault_timers.get(user).get(vault_id);
        let last_seen = self.vault_last_seen.get(user).get(vault_id);
        let bene_bytes = self.vault_beneficiaries.get(user).get(vault_id);
        let bene = Address::from(bene_bytes);
        Ok((active, v_type_u8.to(), amount, timer, last_seen, bene))
    }

    #[allow(non_snake_case)]
    pub fn getVaultCount(&self, user: Address) -> Result<u8, Vec<u8>> {
        let mut active_count = 0;
        for i in 0u8..5u8 {
            if self.vault_active.get(user).get(i) {
                active_count += 1;
            }
        }
        Ok(active_count)
    }
}