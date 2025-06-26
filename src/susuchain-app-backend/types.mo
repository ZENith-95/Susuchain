import Trie "mo:base/Trie";
import HashMap "mo:base/HashMap";

module {
    public type Account = { owner : Principal; subaccount : ?Blob };
    public type TransfereResult = { #Ok : Nat; #Err : TransferError };
    public type TransferError = {
        #GenericError : { message : Text; error_code : Nat };
        #TemporarilyUnavailable;
        #BadBurn : { min_burn_amount : Nat };
        #Duplicate : { duplicate_of : Nat };
        #BadFee : { expected_fee : Nat };
        #CreatedInFuture : { ledger_time : Nat64 };
        #TooOld;
        #InsufficientFunds : { balance : Nat };
    };
    public type GroupContributionResponse = {
        groupId : Text;
        subaccount : Blob;
    };
    public type TransferFromArgs = {
        to : Account;
        fee : ?Nat;
        spender_subaccount : ?Blob;
        from : Account;
        memo : ?Blob;
        created_at_time : ?Nat64;
        amount : Nat;
    };

    public type TransferArg = {
        to : Account;
        fee : ?Nat;
        memo : ?Blob;
        from_subaccount : ?Blob;
        created_at_time : ?Nat64;
        amount : Nat;
    };

    public type SusuGroup = {
        id : Text;
        name : Text;
        description : Text;
        admin : Principal;
        members : [Principal];
        contributionAmount : Nat;
        contributions : Trie.Trie<Principal, Nat>;
        createdAt : Int;
        frequency : ContributionFrequency;
        maxMembers : Nat;
    };
    public type ContributionFrequency = {
        #daily;
        #weekly;
        #monthly;
    };

    public type CreateGroupRequest = {
        groupName : Text;
        description : Text;
        contributionAmount : Nat;
        maxMembers : Nat;
        frequency : ContributionFrequency;
    };
    public type MetadataValue = {
        #Int : Int;
        #Nat : Nat;
        #Blob : Blob;
        #Text : Text;
    };
    public type GroupNotification = {
        groupId : Text;
        message : Text;
        createdAt : Int;
    };
    public type Result_2 = { #Ok : Nat; #Err : TransferFromError };

    public type TransferFromError = {
        #GenericError : { message : Text; error_code : Nat };
        #TemporarilyUnavailable;
        #InsufficientAllowance : { allowance : Nat };
        #BadBurn : { min_burn_amount : Nat };
        #Duplicate : { duplicate_of : Nat };
        #BadFee : { expected_fee : Nat };
        #CreatedInFuture : { ledger_time : Nat64 };
        #TooOld;
        #InsufficientFunds : { balance : Nat };
    };
    public type TokenInterface = actor {
        icrc1_balance_of : shared query Account -> async Nat;
        icrc1_decimals : shared query () -> async Nat8;
        icrc1_fee : shared query () -> async Nat;
        icrc1_metadata : shared query () -> async [(Text, MetadataValue)];
        icrc1_minting_account : shared query () -> async ?Account;
        icrc1_transfer : shared TransferArg -> async TransfereResult;
        icrc2_transfer_from : shared TransferFromArgs -> async Result_2;
    };

};
