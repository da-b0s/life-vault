#![cfg_attr(not(feature = "export-abi"), no_main)]

#[cfg(feature = "export-abi")]
fn main() {
    // We have no constructor, so we output nothing.
    // This satisfies the deployment tool's check.
}