import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import _Blob "mo:base/Blob";
import _Nat8 "mo:base/Nat8";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Trie "mo:base/Trie";
import Buffer "mo:base/Buffer";

import Types "types";
import Account "Account";

actor SusuGroupContributions {
    type TransferArg = Types.TransferArg;
    var susuGroups : HashMap.HashMap<Text, Types.SusuGroup> = HashMap.HashMap(0, Text.equal, Text.hash);

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
        // Convert group name to lowercase manually since toLowercase doesn't exist
        let nameLower = Text.map(request.groupName, func (c : Char) : Char {
            switch (c) {
                case ('A') 'a';
                case ('B') 'b';
                case ('C') 'c';
                case ('D') 'd';
                case ('E') 'e';
                case ('F') 'f';
                case ('G') 'g';
                case ('H') 'h';
                case ('I') 'i';
                case ('J') 'j';
                case ('K') 'k';
                case ('L') 'l';
                case ('M') 'm';
                case ('N') 'n';
                case ('O') 'o';
                case ('P') 'p';
                case ('Q') 'q';
                case ('R') 'r';
                case ('S') 's';
                case ('T') 't';
                case ('U') 'u';
                case ('V') 'v';
                case ('W') 'w';
                case ('X') 'x';
                case ('Y') 'y';
                case ('Z') 'z';
                case (c) c;
            }
        });
        let groupId = Text.replace(nameLower, #text(" "), "-") # "-" # Int.toText(Time.now());
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
                // Use Buffer instead of Array.append for better performance
                let membersBuffer = Buffer.fromArray<Principal>(group.members);
                membersBuffer.add(msg.caller);
                let newGroup = {
                    group with
                    members = Buffer.toArray(membersBuffer)
                };
                susuGroups.put(groupId, newGroup);
                return #ok();
            };
        };
    };
};
