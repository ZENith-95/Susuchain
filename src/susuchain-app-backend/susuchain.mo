import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Principal "mo:base/Principal";
import _Random "mo:base/Random";
import _Debug "mo:base/Debug";
import Result "mo:base/Result";
import _Option "mo:base/Option";
import Timer "mo:base/Timer";

actor SusuChain {
    // ============ TYPES ============
    
    // User Types
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

    public type ContributionFrequency = {
        #daily;
        #weekly;
        #monthly;
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
    public type CreateGroupRequest = {
        name: Text;
        description: Text;
        contributionAmount: Nat;
        frequency: ContributionFrequency;
        maxMembers: Nat;
        startDate: Int;
    };

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

    // ============ STABLE STORAGE ============
    
    private stable var usersEntries : [(Principal, User)] = [];
    private stable var groupsEntries : [(Text, Group)] = [];
    private stable var transactionsEntries : [(Text, Transaction)] = [];
    private stable var userGroupsEntries : [(Principal, [Text])] = [];
    private stable var paymentRequestsEntries : [(Text, PaymentRequest)] = [];
    private stable var notificationsEntries : [(Text, Notification)] = [];
    private stable var userNotificationsEntries : [(Principal, [Text])] = [];
    private stable var nextGroupId : Nat = 1;
    private stable var nextTransactionId : Nat = 1;
    private stable var nextPaymentId : Nat = 1;
    private stable var nextNotificationId : Nat = 1;
    private stable var paystackPublicKey : Text = "";
    private stable var paystackSecretKey : Text = "";

    // ============ RUNTIME STORAGE ============
    
    private var users = HashMap.HashMap<Principal, User>(10, Principal.equal, Principal.hash);
    private var groups = HashMap.HashMap<Text, Group>(10, Text.equal, Text.hash);
    private var transactions = HashMap.HashMap<Text, Transaction>(10, Text.equal, Text.hash);
    private var userGroups = HashMap.HashMap<Principal, [Text]>(10, Principal.equal, Principal.hash);
    private var paymentRequests = HashMap.HashMap<Text, PaymentRequest>(10, Text.equal, Text.hash);
    private var notifications = HashMap.HashMap<Text, Notification>(10, Text.equal, Text.hash);
    private var userNotifications = HashMap.HashMap<Principal, [Text]>(10, Principal.equal, Principal.hash);

    // ============ SYSTEM FUNCTIONS ============
    
    system func preupgrade() {
        usersEntries := Iter.toArray(users.entries());
        groupsEntries := Iter.toArray(groups.entries());
        transactionsEntries := Iter.toArray(transactions.entries());
        userGroupsEntries := Iter.toArray(userGroups.entries());
        paymentRequestsEntries := Iter.toArray(paymentRequests.entries());
        notificationsEntries := Iter.toArray(notifications.entries());
        userNotificationsEntries := Iter.toArray(userNotifications.entries());
    };

    system func postupgrade() {
        users := HashMap.fromIter<Principal, User>(Iter.fromArray(usersEntries), usersEntries.size(), Principal.equal, Principal.hash);
        groups := HashMap.fromIter<Text, Group>(Iter.fromArray(groupsEntries), groupsEntries.size(), Text.equal, Text.hash);
        transactions := HashMap.fromIter<Text, Transaction>(Iter.fromArray(transactionsEntries), transactionsEntries.size(), Text.equal, Text.hash);
        userGroups := HashMap.fromIter<Principal, [Text]>(Iter.fromArray(userGroupsEntries), userGroupsEntries.size(), Principal.equal, Principal.hash);
        paymentRequests := HashMap.fromIter<Text, PaymentRequest>(Iter.fromArray(paymentRequestsEntries), paymentRequestsEntries.size(), Text.equal, Text.hash);
        notifications := HashMap.fromIter<Text, Notification>(Iter.fromArray(notificationsEntries), notificationsEntries.size(), Text.equal, Text.hash);
        userNotifications := HashMap.fromIter<Principal, [Text]>(Iter.fromArray(userNotificationsEntries), userNotificationsEntries.size(), Principal.equal, Principal.hash);
    };

    // ============ HELPER FUNCTIONS ============
    
    private func generateGroupId() : Text {
        let id = "SG" # Nat.toText(nextGroupId) # "ABC";
        nextGroupId += 1;
        id
    };

    private func generateTransactionId() : Text {
        let id = "TXN" # Nat.toText(nextTransactionId);
        nextTransactionId += 1;
        id
    };

    private func generatePaymentId() : Text {
        let id = "PAY_" # Nat.toText(nextPaymentId);
        nextPaymentId += 1;
        id
    };

    private func generateNotificationId() : Text {
        let id = "NOTIF_" # Nat.toText(nextNotificationId);
        nextNotificationId += 1;
        id
    };

    private func generateReference() : Text {
        "REF_" # Int.toText(Time.now())
    };

    private func isAuthorized(caller: Principal) : Bool {
        switch (users.get(caller)) {
            case (?_user) { true };
            case null { false };
        }
    };

    private func _getUserGroupIds(userId: Principal) : [Text] {
        switch (userGroups.get(userId)) {
            case (?groupIds) { groupIds };
            case null { [] };
        }
    };

    private func addUserToGroup(userId: Principal, groupId: Text) {
        let currentGroups = _getUserGroupIds(userId);
        let newGroups = Array.append(currentGroups, [groupId]);
        userGroups.put(userId, newGroups);
    };

    private func calculateNextPayoutDate(startDate: Int, frequency: ContributionFrequency, cycle: Nat) : Int {
        let cycleMultiplier = switch (frequency) {
            case (#daily) { 24 * 60 * 60 * 1000_000_000 };
            case (#weekly) { 7 * 24 * 60 * 60 * 1000_000_000 };
            case (#monthly) { 30 * 24 * 60 * 60 * 1000_000_000 };
        };
        startDate + (cycle * cycleMultiplier)
    };

    private func addNotificationToUser(userId: Principal, notificationId: Text) {
        let currentNotifications = switch (userNotifications.get(userId)) {
            case (?notifs) { notifs };
            case null { [] };
        };
        let updatedNotifications = Array.append(currentNotifications, [notificationId]);
        userNotifications.put(userId, updatedNotifications);
    };

    // ============ USER MANAGEMENT ============
    
    public shared(msg) func registerUser(walletType: WalletType) : async Result<User, ApiError> {
        let caller = msg.caller;
        
        switch (users.get(caller)) {
            case (?existingUser) {
                #ok(existingUser)
            };
            case null {
                let newUser : User = {
                    id = caller;
                    principal = caller;
                    walletType = walletType;
                    balance = 0;
                    createdAt = Time.now();
                    updatedAt = Time.now();
                };
                users.put(caller, newUser);
                #ok(newUser)
            };
        }
    };

    public shared(msg) func getUser() : async Result<User, ApiError> {
        let caller = msg.caller;
        switch (users.get(caller)) {
            case (?user) { #ok(user) };
            case null { #err(#notFound("User not found")) };
        }
    };

    public shared(msg) func updateUserBalance(amount: Nat, isDeposit: Bool) : async Result<User, ApiError> {
        let caller = msg.caller;
        switch (users.get(caller)) {
            case (?user) {
                let newBalance = if (isDeposit) {
                    user.balance + amount
                } else {
                    let currentBalanceInt : Int = user.balance;
                    let amountInt : Int = amount;
                    let newBalanceInt = currentBalanceInt - amountInt;
                    
                    if (newBalanceInt < 0) {
                        return #err(#insufficientFunds("Insufficient balance"));
                    };
                    
                    Int.abs(newBalanceInt)
                };
                
                let updatedUser = {
                    user with
                    balance = newBalance;
                    updatedAt = Time.now();
                };
                users.put(caller, updatedUser);
                #ok(updatedUser)
            };
            case null { #err(#notFound("User not found")) };
        }
    };

    // ============ GROUP MANAGEMENT ============
    
    public shared(msg) func createGroup(request: CreateGroupRequest) : async Result<Group, ApiError> {
        let caller = msg.caller;
        
        if (not isAuthorized(caller)) {
            return #err(#unauthorized("User not registered"));
        };

        let groupId = generateGroupId();
        let now = Time.now();
        
        let newGroup : Group = {
            id = groupId;
            name = request.name;
            description = request.description;
            admin = caller;
            members = [{
                userId = caller;
                joinedAt = now;
                payoutOrder = 1;
                hasReceivedPayout = false;
                payoutDate = ?calculateNextPayoutDate(request.startDate, request.frequency, 1);
                contributionStatus = #pending;
                paymentMethod = #mobileMoney(#mtn); // Default payment method for now
            }];
            contributionAmount = request.contributionAmount;
            frequency = request.frequency;
            maxMembers = request.maxMembers;
            currentCycle = 1;
            totalCycles = request.maxMembers;
            startDate = request.startDate;
            nextPayoutDate = calculateNextPayoutDate(request.startDate, request.frequency, 1);
            isActive = true;
            createdAt = now;
            updatedAt = now;
        };

        groups.put(groupId, newGroup);
        addUserToGroup(caller, groupId);
        
        // Create notification for group creation
        ignore await createNotification(
            caller,
            "Group Created",
            "Your group '" # request.name # "' has been created successfully",
            #systemAlert,
            ?{ groupId = ?groupId; amount = null; dueDate = null }
        );

        #ok(newGroup)
    };

    public shared(msg) func joinGroup(request: JoinGroupRequest) : async Result<Group, ApiError> {
        let caller = msg.caller;
        
        if (not isAuthorized(caller)) {
            return #err(#unauthorized("User not registered"));
        };

        switch (groups.get(request.groupCode)) {
            case (?group) {
                if (group.members.size() >= group.maxMembers) {
                    return #err(#groupFull("Group has reached maximum capacity"));
                };

                let isAlreadyMember = Array.find<Member>(group.members, func(member) {
                    Principal.equal(member.userId, caller)
                });

                switch (isAlreadyMember) {
                    case (?_) { #err(#alreadyMember("User is already a member of this group")) };
                    case null {
                        let newMember : Member = {
                            userId = caller;
                            joinedAt = Time.now();
                            payoutOrder = group.members.size() + 1;
                            hasReceivedPayout = false;
                            payoutDate = ?calculateNextPayoutDate(group.startDate, group.frequency, group.members.size() + 1);
                            contributionStatus = #pending;
                            paymentMethod = #mobileMoney(#mtn); // Default payment method for now
                        };

                        let updatedMembers = Array.append(group.members, [newMember]);
                        let updatedGroup = {
                            group with 
                            members = updatedMembers;
                            updatedAt = Time.now();
                        };

                        groups.put(request.groupCode, updatedGroup);
                        addUserToGroup(caller, request.groupCode);
                        
                        // Notify user and admin
                        ignore await createNotification(
                            caller,
                            "Joined Group",
                            "You have successfully joined '" # group.name # "'",
                            #systemAlert,
                            ?{ groupId = ?request.groupCode; amount = null; dueDate = null }
                        );

                        ignore await createNotification(
                            group.admin,
                            "New Member",
                            "A new member has joined your group '" # group.name # "'",
                            #systemAlert,
                            ?{ groupId = ?request.groupCode; amount = null; dueDate = null }
                        );

                        #ok(updatedGroup)
                    };
                }
            };
            case null { #err(#notFound("Group not found")) };
        }
    };

    public shared(_msg) func getGroup(groupId: Text) : async Result<Group, ApiError> {
        switch (groups.get(groupId)) {
            case (?group) { #ok(group) };
            case null { #err(#notFound("Group not found")) };
        }
    };

    public shared(msg) func getUserGroups() : async Result<[Group], ApiError> {
        let caller = msg.caller;
        let groupIds = _getUserGroupIds(caller);
        
        let userGroupsList = Array.mapFilter<Text, Group>(groupIds, func(groupId) {
            groups.get(groupId)
        });

        #ok(userGroupsList)
    };

    // ============ TRANSACTION MANAGEMENT ============
    
    public shared(msg) func deposit(request: DepositRequest) : async Result<Transaction, ApiError> {
        let caller = msg.caller;
        
        if (not isAuthorized(caller)) {
            return #err(#unauthorized("User not registered"));
        };

        let transactionId = generateTransactionId();
        let now = Time.now();

        let transaction : Transaction = {
            id = transactionId;
            userId = caller;
            transactionType = #deposit;
            amount = request.amount;
            status = #completed;
            method = request.paymentMethod;
            groupId = null;
            timestamp = now;
            reference = request.reference;
        };

        transactions.put(transactionId, transaction);
        
        switch (await updateUserBalance(request.amount, true)) {
            case (#ok(_)) { 
                ignore await createNotification(
                    caller,
                    "Deposit Successful",
                    "₵" # Nat.toText(request.amount) # " has been deposited to your wallet",
                    #paymentConfirmation,
                    ?{ groupId = null; amount = ?request.amount; dueDate = null }
                );
                #ok(transaction) 
            };
            case (#err(error)) { #err(error) };
        }
    };

    public shared(msg) func withdraw(request: WithdrawRequest) : async Result<Transaction, ApiError> {
        let caller = msg.caller;
        
        if (not isAuthorized(caller)) {
            return #err(#unauthorized("User not registered"));
        };

        switch (users.get(caller)) {
            case (?user) {
                if (user.balance < request.amount) {
                    return #err(#insufficientFunds("Insufficient balance"));
                };

                let transactionId = generateTransactionId();
                let now = Time.now();

                let transaction : Transaction = {
                    id = transactionId;
                    userId = caller;
                    transactionType = #withdraw;
                    amount = request.amount;
                    status = #completed;
                    method = request.paymentMethod;
                    groupId = null;
                    timestamp = now;
                    reference = null;
                };

                transactions.put(transactionId, transaction);
                
                switch (await updateUserBalance(request.amount, false)) {
                    case (#ok(_)) { 
                        ignore await createNotification(
                            caller,
                            "Withdrawal Successful",
                            "₵" # Nat.toText(request.amount) # " has been withdrawn from your wallet",
                            #paymentConfirmation,
                            ?{ groupId = null; amount = ?request.amount; dueDate = null }
                        );
                        #ok(transaction) 
                    };
                    case (#err(error)) { #err(error) };
                }
            };
            case null { #err(#notFound("User not found")) };
        }
    };

    public shared(msg) func contribute(request: ContributeRequest) : async Result<Transaction, ApiError> {
        let caller = msg.caller;
        
        if (not isAuthorized(caller)) {
            return #err(#unauthorized("User not registered"));
        };

        switch (groups.get(request.groupId)) {
            case (?group) {
                let memberOpt = Array.find<Member>(group.members, func(member) {
                    Principal.equal(member.userId, caller)
                });

                switch (memberOpt) {
                    case (?member) {
                        if (request.amount != group.contributionAmount) {
                            return #err(#badRequest("Contribution amount must match group requirement"));
                        };

                        let transactionId = generateTransactionId();
                        let now = Time.now();

                        let transaction : Transaction = {
                            id = transactionId;
                            userId = caller;
                            transactionType = #groupContribution;
                            amount = request.amount;
                            status = #completed;
                            method = request.paymentMethod;
                            groupId = ?request.groupId;
                            timestamp = now;
                            reference = request.reference;
                        };

                        transactions.put(transactionId, transaction);

                        let updatedMembers = Array.map<Member, Member>(group.members, func(m) {
                            if (Principal.equal(m.userId, caller)) {
                                { m with contributionStatus = #paid }
                            } else { m }
                        });

                        let updatedGroup = {
                            group with 
                            members = updatedMembers;
                            updatedAt = now;
                        };

                        groups.put(request.groupId, updatedGroup);
                        
                        ignore await createNotification(
                            caller,
                            "Contribution Successful",
                            "Your contribution of ₵" # Nat.toText(request.amount) # " to '" # group.name # "' was successful",
                            #paymentConfirmation,
                            ?{ groupId = ?request.groupId; amount = ?request.amount; dueDate = null }
                        );

                        #ok(transaction)
                    };
                    case null { #err(#unauthorized("User is not a member of this group")) };
                }
            };
            case null { #err(#notFound("Group not found")) };
        }
    };

    public shared(msg) func withdrawPayout(groupId: Text) : async Result<Transaction, ApiError> {
        let caller = msg.caller;
        
        if (not isAuthorized(caller)) {
            return #err(#unauthorized("User not registered"));
        };

        switch (groups.get(groupId)) {
            case (?group) {
                let memberOpt = Array.find<Member>(group.members, func(member) {
                    Principal.equal(member.userId, caller)
                });

                switch (memberOpt) {
                    case (?member) {
                        if (member.hasReceivedPayout) {
                            return #err(#badRequest("Payout already received"));
                        };

                        if (member.payoutOrder != group.currentCycle) {
                            return #err(#badRequest("Not your turn for payout"));
                        };

                        let payoutAmount = group.contributionAmount * group.members.size();
                        let transactionId = generateTransactionId();
                        let now = Time.now();

                        let transaction : Transaction = {
                            id = transactionId;
                            userId = caller;
                            transactionType = #groupPayout;
                            amount = payoutAmount;
                            status = #completed;
                            method = member.paymentMethod; // Use member's preferred payment method
                            groupId = ?groupId;
                            timestamp = now;
                            reference = null;
                        };

                        transactions.put(transactionId, transaction);

                        let updatedMembers = Array.map<Member, Member>(group.members, func(m) {
                            if (Principal.equal(m.userId, caller)) {
                                { m with hasReceivedPayout = true; payoutDate = ?now }
                            } else { m }
                        });

                        let updatedGroup = {
                            group with 
                            members = updatedMembers;
                            currentCycle = group.currentCycle + 1;
                            nextPayoutDate = calculateNextPayoutDate(group.startDate, group.frequency, group.currentCycle + 1);
                            updatedAt = now;
                        };

                        groups.put(groupId, updatedGroup);
                        ignore await updateUserBalance(payoutAmount, true);
                        
                        ignore await createNotification(
                            caller,
                            "Payout Received",
                            "You have received ₵" # Nat.toText(payoutAmount) # " from '" # group.name # "'",
                            #payoutAvailable,
                            ?{ groupId = ?groupId; amount = ?payoutAmount; dueDate = null }
                        );

                        #ok(transaction)
                    };
                    case null { #err(#unauthorized("User is not a member of this group")) };
                }
            };
            case null { #err(#notFound("Group not found")) };
        }
    };

    public shared(msg) func getUserTransactions() : async Result<[Transaction], ApiError> {
        let caller = msg.caller;
        
        let userTransactions = Array.filter<Transaction>(
            Iter.toArray(transactions.vals()),
            func(transaction) {
                Principal.equal(transaction.userId, caller)
            }
        );

        let sortedTransactions = Array.sort<Transaction>(userTransactions, func(a, b) {
            Int.compare(b.timestamp, a.timestamp)
        });

        #ok(sortedTransactions)
    };

    // ============ PAYMENT GATEWAY ============
    
    public shared(_msg) func configurePaystack(publicKey: Text, secretKey: Text) : async Result<Bool, ApiError> {
        paystackPublicKey := publicKey;
        paystackSecretKey := secretKey;
        #ok(true)
    };

    public shared(msg) func initiatePayment(request: InitiatePaymentRequest) : async Result<PaymentResponse, ApiError> {
        let caller = msg.caller;
        let paymentId = generatePaymentId();
        let reference = generateReference();
        
        let paymentRequest : PaymentRequest = {
            id = paymentId;
            userId = caller;
            amount = request.amount;
            currency = request.currency;
            provider = request.provider;
            phoneNumber = request.phoneNumber;
            status = #pending;
            reference = reference;
            createdAt = Time.now();
            completedAt = null;
        };

        paymentRequests.put(paymentId, paymentRequest);

        let response : PaymentResponse = {
            paymentId = paymentId;
            reference = reference;
            status = #pending;
            authorizationUrl = ?("https://checkout.paystack.com/" # reference);
        };

        #ok(response)
    };

    public shared(_msg) func verifyPayment(paymentId: Text) : async Result<PaymentRequest, ApiError> {
        switch (paymentRequests.get(paymentId)) {
            case (?payment) {
                let updatedPayment = {
                    payment with 
                    status = #completed;
                    completedAt = ?Time.now();
                };
                
                paymentRequests.put(paymentId, updatedPayment);
                #ok(updatedPayment)
            };
            case null { #err(#notFound("Payment not found")) };
        }
    };

    public shared(msg) func getUserPayments() : async Result<[PaymentRequest], ApiError> {
        let caller = msg.caller;
        let userPayments = Array.filter<PaymentRequest>(
            Iter.toArray(paymentRequests.vals()),
            func(payment) {
                Principal.equal(payment.userId, caller)
            }
        );
        #ok(userPayments)
    };

    // ============ NOTIFICATION SYSTEM ============
    
    public func createNotification(
        userId: Principal,
        title: Text,
        message: Text,
        notificationType: NotificationType,
        data: ?NotificationData
    ) : async Result<Notification, ApiError> {
        let notificationId = generateNotificationId();

        let notification : Notification = {
            id = notificationId;
            userId = userId;
            title = title;
            message = message;
            notificationType = notificationType;
            isRead = false;
            createdAt = Time.now();
            data = data;
        };

        notifications.put(notificationId, notification);
        addNotificationToUser(userId, notificationId);

        #ok(notification)
    };

    public shared(msg) func getUserNotifications() : async Result<[Notification], ApiError> {
        let caller = msg.caller;
        
        let notificationIds = switch (userNotifications.get(caller)) {
            case (?ids) { ids };
            case null { [] };
        };

        let userNotifs = Array.mapFilter<Text, Notification>(notificationIds, func(id) {
            notifications.get(id)
        });

        let sortedNotifications = Array.sort<Notification>(userNotifs, func(a, b) {
            Int.compare(b.createdAt, a.createdAt)
        });

        #ok(sortedNotifications)
    };

    public shared(msg) func markAsRead(notificationId: Text) : async Result<Bool, ApiError> {
        let caller = msg.caller;
        
        switch (notifications.get(notificationId)) {
            case (?notification) {
                if (not Principal.equal(notification.userId, caller)) {
                    return #err(#unauthorized("Cannot mark other user's notification"));
                };

                let updatedNotification = {
                    notification with isRead = true;
                };
                notifications.put(notificationId, updatedNotification);
                #ok(true)
            };
            case null { #err(#notFound("Notification not found")) };
        }
    };

    public func sendContributionReminders(groupId: Text, memberIds: [Principal], amount: Nat, dueDate: Int) : async () {
        for (memberId in memberIds.vals()) {
            ignore await createNotification(
                memberId,
                "Contribution Reminder",
                "Your contribution of ₵" # Nat.toText(amount) # " is due soon",
                #contributionReminder,
                ?{
                    groupId = ?groupId;
                    amount = ?amount;
                    dueDate = ?dueDate;
                }
            );
        };
    };

    public func sendPayoutNotification(userId: Principal, groupId: Text, amount: Nat) : async () {
        ignore await createNotification(
            userId,
            "Payout Available",
            "Your payout of ₵" # Nat.toText(amount) # " is ready for collection",
            #payoutAvailable,
            ?{
                groupId = ?groupId;
                amount = ?amount;
                dueDate = null;
            }
        );
    };

    // ============ DASHBOARD API ============
    
    public shared(msg) func getDashboard() : async Result<DashboardData, ApiError> {
        let caller = msg.caller;
        
        switch (users.get(caller)) {
            case (?user) {
                let userGroupsList = switch (await getUserGroups()) {
                    case (#ok(groups)) { groups };
                    case (#err(_)) { [] };
                };

                let recentTransactions = switch (await getUserTransactions()) {
                    case (#ok(transactions)) { 
                        if (transactions.size() > 5) {
                            Array.subArray(transactions, 0, 5)
                        } else {
                            transactions
                        }
                    };
                    case (#err(_)) { [] };
                };

                let activities = Array.mapFilter<Group, Activity>(userGroupsList, func(group) {
                    let memberOpt = Array.find<Member>(group.members, func(member) {
                        Principal.equal(member.userId, caller)
                    });

                    switch (memberOpt) {
                        case (?member) {
                            if (member.contributionStatus == #pending) {
                                ?{
                                    activityType = #contributionDue;
                                    groupId = ?group.id;
                                    groupName = ?group.name;
                                    amount = group.contributionAmount;
                                    dueDate = group.nextPayoutDate;
                                    description = "Contribution due for " # group.name;
                                }
                            } else if (member.payoutOrder == group.currentCycle and not member.hasReceivedPayout) {
                                ?{
                                    activityType = #payoutAvailable;
                                    groupId = ?group.id;
                                    groupName = ?group.name;
                                    amount = group.contributionAmount * group.members.size();
                                    dueDate = group.nextPayoutDate;
                                    description = "Payout available for " # group.name;
                                }
                            } else {
                                null
                            }
                        };
                        case null { null };
                    }
                });

                let dashboardData : DashboardData = {
                    user = user;
                    totalBalance = user.balance;
                    activeGroups = userGroupsList;
                    upcomingActivities = activities;
                    recentTransactions = recentTransactions;
                };

                #ok(dashboardData)
            };
            case null { #err(#notFound("User not found")) };
        }
    };

    // ============ ADMIN FUNCTIONS ============
    
    public shared(msg) func getGroupMembers(groupId: Text) : async Result<[Member], ApiError> {
        let caller = msg.caller;
        
        switch (groups.get(groupId)) {
            case (?group) {
                if (not Principal.equal(group.admin, caller)) {
                    return #err(#unauthorized("Only group admin can view members"));
                };
                #ok(group.members)
            };
            case null { #err(#notFound("Group not found")) };
        }
    };

    public shared(msg) func updateGroupStatus(groupId: Text, isActive: Bool) : async Result<Group, ApiError> {
        let caller = msg.caller;
        
        switch (groups.get(groupId)) {
            case (?group) {
                if (not Principal.equal(group.admin, caller)) {
                    return #err(#unauthorized("Only group admin can update group status"));
                };

                let updatedGroup = {
                    group with 
                    isActive = isActive;
                    updatedAt = Time.now();
                };

                groups.put(groupId, updatedGroup);
                #ok(updatedGroup)
            };
            case null { #err(#notFound("Group not found")) };
        }
    };

    public shared(msg) func advanceGroupCycle(groupId: Text) : async Result<Group, ApiError> {
        let caller = msg.caller;

        switch (groups.get(groupId)) {
            case (?group) {
                if (not Principal.equal(group.admin, caller)) {
                    return #err(#unauthorized("Only group admin can advance group cycle"));
                };

                if (group.currentCycle >= group.totalCycles) {
                    return #err(#badRequest("Group has completed all cycles"));
                };

                // Reset contribution status and payout status for all members for the new cycle
                let resetMembers = Array.map<Member, Member>(group.members, func(m) {
                    { m with contributionStatus = #pending; hasReceivedPayout = false; payoutDate = null }
                });

                let updatedGroup = {
                    group with
                    currentCycle = group.currentCycle + 1;
                    nextPayoutDate = calculateNextPayoutDate(group.startDate, group.frequency, group.currentCycle + 1);
                    members = resetMembers; // Reset members for new cycle
                    updatedAt = Time.now();
                };

                groups.put(groupId, updatedGroup);
                #ok(updatedGroup)
            };
            case null { #err(#notFound("Group not found")) };
        }
    };
    
    // ============ SYSTEM FUNCTIONS ============
    
    public query func getCanisterStatus() : async {
        totalUsers: Nat;
        totalGroups: Nat;
        totalTransactions: Nat;
        totalPayments: Nat;
        totalNotifications: Nat;
    } {
        {
            totalUsers = users.size();
            totalGroups = groups.size();
            totalTransactions = transactions.size();
            totalPayments = paymentRequests.size();
            totalNotifications = notifications.size();
        }
    };

    // ============ AUTOMATED TASKS ============
    
    // Timer for sending contribution reminders
    private func checkContributionReminders() : async () {
        let now = Time.now();
        let reminderThreshold = 24 * 60 * 60 * 1000_000_000; // 24 hours in nanoseconds
        
        for ((groupId, group) in groups.entries()) {
            if (group.isActive and (group.nextPayoutDate - now) <= reminderThreshold) {
                let pendingMembers = Array.filter<Member>(group.members, func(member) {
                    member.contributionStatus == #pending
                });
                
                let memberIds = Array.map<Member, Principal>(pendingMembers, func(member) {
                    member.userId
                });
                
                if (memberIds.size() > 0) {
                    await sendContributionReminders(groupId, memberIds, group.contributionAmount, group.nextPayoutDate);
                };
            };
        };
    };

    // Initialize timer for automated tasks
    ignore Timer.recurringTimer<system>(#seconds(3600), checkContributionReminders); // Run every hour
}
