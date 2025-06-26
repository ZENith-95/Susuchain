dfx extension install nns
dfx canister install token --argument "(variant { Init = record { minting_account = record { owner = principal \"ulvla-h7777-77774-qaacq-cai\"; }; initial_values = vec {}; send_whitelist = vec {}; transfer_fee = opt record { e8s = 10_000 : nat64; }; token_symbol = opt variant { Text = \"LICP\" }; token_name = opt variant { Text = \"Local ICP\" }; } })"
dfx deploy token --argument '(variant {
    Init = record {
      decimals = null;
      token_symbol = "LICP";
      transfer_fee = 10_000 : nat;
      metadata = vec {};
      minting_account = record {
        owner = principal "ulvla-h7777-77774-qaacq-cai";
        subaccount = null;
      };
      initial_balances = vec {};
      maximum_number_of_accounts = null;
      accounts_overflow_trim_quantity = null;
      fee_collector_account = null;
      archive_options = record {
        num_blocks_to_archive = 1_000 : nat64;
        max_transactions_per_response = null;
        trigger_threshold = 2_000 : nat64;
        max_message_size_bytes = null;
        cycles_for_archive_creation = null;
        node_max_memory_size_bytes = null;
        controller_id = principal "ulvla-h7777-77774-qaacq-cai";
      };
      max_memo_length = null;
      token_name = "Local ICP";
      feature_flags = opt record { icrc2 = false };
    }
  })
'
# dfx canister call token icrc1_transfer "(record { 
#   to = record { 
#     owner = principal \"5tjvo-jiaaa-aaaal-qsjvq-cai\";
#   }; 
#   amount = 500_000_000_000_000_000;
# })"


# dfx canister call token icrc2_approve "(record { 
#   amount = 1_000_010_000; 
#   spender = record { 
#     owner = principal \"nlwxt-arya3-k3zf3-2mr2w-cev5a-lftm2-22vtw-6velq-muscg-b34ej-pqe\";
#   }; 
# })"

# dfx canister call token icrc2_transfer_from "(record { 
#   amount = 1_000_000_000; 
#   from = record { 
#     owner = principal \"r52up-53nzf-qabm7-umbpm-mma4z-alcym-ngag4-de5j5-yx6xt-azgsp-lae\";
#   }; 
#   to = record { 
#     owner = principal \"nlwxt-arya3-k3zf3-2mr2w-cev5a-lftm2-22vtw-6velq-muscg-b34ej-pqe\";
#   }; 
# })"

# Demo = r52up-53nzf-qabm7-umbpm-mma4z-alcym-ngag4-de5j5-yx6xt-azgsp-lae
# Default = aokql-627cq-e54sj-hq3k5-6wway-pfgx7-6fcxq-7zsmx-j3rq6-32hpa-5qe
# Firstid = shu3y-t65bi-rhvef-c7vvy-arrzh-emws6-g2uew-hpgh2-uvjqi-7s3b2-zae
# Minter = nlwxt-arya3-k3zf3-2mr2w-cev5a-lftm2-22vtw-6velq-muscg-b34ej-pqe

