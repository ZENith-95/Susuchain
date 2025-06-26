import Icrc1 "canister:token";

import Types "types";
import Array "mo:base/Array";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Trie "mo:base/Trie";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Blob "mo:base/Blob";
import Nat8 "mo:base/Nat8";
import Account "Account";

actor SusuGroupContributions {
    type TransferArg = Types.TransferArg;
    var susuGroups : HashMap.HashMap<Text, Types.SusuGroup> = HashMap.HashMap(0, Text.equal, Text.hash);
    // var tokenCanister : Types.TokenInterface = actor (tokenCanister);
    // var groupNotifications : HashMap.HashMap<Text, Types.GroupNotification> = HashMap.HashMap(0, Text.equal, Text.hash);

    private stable var ledgerActor : Types.LedgerInterface = actor ("ucwa4-rx777-77774-qaada-cai") : Types.LedgerInterface;

    public shared (msg) func contributeToGroup(groupId : Text) : async Result.Result<Types.GroupContributionResponse, Text> {
        let group = susuGroups.get(groupId);
        switch (group) {
            case (null) {
                return #err("Group not found");
            };
            case (?group) {
                if (Array.find<Principal>(group.members, func(p) { p == msg.caller }) == null) return #err("User is not a member of this group");
                let acc : Types.Account = {
                    owner = Principal.fromActor(SusuGroupContributions);
                    subaccount = ?Account.toSubaccount(msg.caller);
                };
                let response : Types.GroupContributionResponse = {
                    groupId = groupId;
                    subaccount = Account.toText(acc);
                };
                return #ok(response);
            };
        };
    };

    public shared (msg) func getBalance() : async Nat {
        let acc : Types.Account = {
            owner = Principal.fromActor(SusuGroupContributions);
            subaccount = ?Account.toSubaccount(msg.caller);
        };
        var response : Nat = await ledgerActor.icrc1_balance_of(acc);
        return response;
    };

    public func getGroup(groupId : Text) : async Result.Result<Types.SusuGroup, Text> {
        let group = susuGroups.get(groupId);
        switch (group) {
            case (null) { return #err("Group not found") };
            case (?group) { return #ok(group) };
        };
    };
    public func getGroups() : async Result.Result<[Types.SusuGroup], Text> {
        let groups = Iter.toArray(susuGroups.vals());
        return #ok(groups);
    };
    public shared (msg) func createGroup(
        request : Types.CreateGroupRequest
    ) : async Result.Result<Types.SusuGroup, Text> {
        let groupId = Text.toLowercase(Text.replace(request.groupName, #text(" "), "-")) # "-" # Int.toText(Time.now());
        let group : Types.SusuGroup = {
            id = groupId;
            name = request.groupName;
            description = request.description;
            admin = msg.caller;
            members = [msg.caller];
            contributionAmount = request.contributionAmount;
            contributions = Trie.empty();
            createdAt = Time.now();
            frequency = request.frequency;
            maxMembers = request.maxMembers;
        };
        susuGroups.put(groupId, group);
        return #ok(group);

    };

    public shared (msg) func joinGroup(groupId : Text) : async Result.Result<(), Text> {
        let group = susuGroups.get(groupId);
        switch (group) {
            case (null) {
                return #err("Group not found");
            };
            case (?group) {
                if (Array.size(group.members) == group.maxMembers) {
                    return #err("Group is full");
                };
                if (Array.find<Principal>(group.members, func(p) { p == msg.caller }) != null) {
                    return #err("Already a member of this group");
                };
                let newGroup = {
                    group with
                    members = Array.append(group.members, [msg.caller])
                };
                susuGroups.put(groupId, newGroup);
                return #ok();
            };
        };
    };

};
