import Trie "mo:base/Trie";
import Principal "mo:base/Principal";
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
        subaccount : Text;
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
    public type LedgerInterface = actor {
        icrc1_balance_of : shared query Account -> async Nat;
        icrc1_decimals : shared query () -> async Nat8;
        icrc1_fee : shared query () -> async Nat;
        icrc1_metadata : shared query () -> async [(Text, MetadataValue)];
        icrc1_minting_account : shared query () -> async ?Account;
        icrc1_transfer : shared TransferArg -> async TransfereResult;
        icrc2_transfer_from : shared TransferFromArgs -> async Result_2;
    };

    public type UserId = Principal;
    
    public type User = {
        id: UserId;
        principal: Principal;
        walletType: WalletType;
        balance: Nat;
        createdAt: Int;
        updatedAt: Int;
    };

    public type WalletType = {
        #plug;
        #internetIdentity;
    };

    // Group Types
    public type GroupId = Text;
    
    public type Group = {
        id: GroupId;
        name: Text;
        description: Text;
        admin: UserId;
        members: [Member];
        contributionAmount: Nat;
        frequency: ContributionFrequency;
        maxMembers: Nat;
        currentCycle: Nat;
        totalCycles: Nat;
        startDate: Int;
        nextPayoutDate: Int;
        isActive: Bool;
        createdAt: Int;
        updatedAt: Int;
    };

    public type Member = {
        userId: UserId;
        joinedAt: Int;
        payoutOrder: Nat;
        hasReceivedPayout: Bool;
        payoutDate: ?Int;
        contributionStatus: ContributionStatus;
        paymentMethod: PaymentMethod; // Add payment method for payout
    };

  
    public type ContributionStatus = {
        #pending;
        #paid;
        #overdue;
    };

    // Transaction Types
    public type TransactionId = Text;
    
    public type Transaction = {
        id: TransactionId;
        userId: UserId;
        transactionType: TransactionType;
        amount: Nat;
        status: TransactionStatus;
        method: PaymentMethod;
        groupId: ?GroupId;
        timestamp: Int;
        reference: ?Text;
    };

    public type TransactionType = {
        #deposit;
        #withdraw;
        #groupContribution;
        #groupPayout;
    };

    public type TransactionStatus = {
        #pending;
        #completed;
        #failed;
        #cancelled;
    };

    public type PaymentMethod = {
        #mobileMoney: MobileMoneyProvider;
        #bankTransfer;
        #crypto;
    };

    public type MobileMoneyProvider = {
        #mtn;
        #vodafone;
        #airtelTigo;
    };

    // Payment Types
    public type PaymentRequest = {
        id: Text;
        userId: Principal;
        amount: Nat;
        currency: Text;
        provider: MobileMoneyProvider;
        phoneNumber: Text;
        status: PaymentStatus;
        reference: Text;
        createdAt: Int;
        completedAt: ?Int;
    };

    public type PaymentStatus = {
        #pending;
        #processing;
        #completed;
        #failed;
        #cancelled;
    };

    // Notification Types
    public type Notification = {
        id: Text;
        userId: Principal;
        title: Text;
        message: Text;
        notificationType: NotificationType;
        isRead: Bool;
        createdAt: Int;
        data: ?NotificationData;
    };

    public type NotificationType = {
        #contributionReminder;
        #payoutAvailable;
        #groupInvite;
        #paymentConfirmation;
        #systemAlert;
    };

    public type NotificationData = {
        groupId: ?Text;
        amount: ?Nat;
        dueDate: ?Int;
    };

    // API Response Types
    public type Result<T, E> = {
        #ok: T;
        #err: E;
    };

    public type ApiError = {
        #notFound: Text;
        #unauthorized: Text;
        #badRequest: Text;
        #internalError: Text;
        #insufficientFunds: Text;
        #groupFull: Text;
        #alreadyMember: Text;
    };

    // Request Types
  

    public type JoinGroupRequest = {
        groupCode: GroupId;
    };

    public type ContributeRequest = {
        groupId: GroupId;
        amount: Nat;
        paymentMethod: PaymentMethod;
        reference: ?Text;
    };

    public type WithdrawRequest = {
        amount: Nat;
        paymentMethod: PaymentMethod;
    };

    public type DepositRequest = {
        amount: Nat;
        paymentMethod: PaymentMethod;
        reference: ?Text;
    };

    public type InitiatePaymentRequest = {
        amount: Nat;
        phoneNumber: Text;
        provider: MobileMoneyProvider;
        currency: Text;
    };

    public type PaymentResponse = {
        paymentId: Text;
        reference: Text;
        status: PaymentStatus;
        authorizationUrl: ?Text;
    };

    // Dashboard Types
    public type DashboardData = {
        user: User;
        totalBalance: Nat;
        activeGroups: [Group];
        upcomingActivities: [Activity];
        recentTransactions: [Transaction];
    };

    public type Activity = {
        activityType: ActivityType;
        groupId: ?GroupId;
        groupName: ?Text;
        amount: Nat;
        dueDate: Int;
        description: Text;
    };

    public type ActivityType = {
        #contributionDue;
        #payoutAvailable;
        #groupStarting;
        #cycleComplete;
    };

};
