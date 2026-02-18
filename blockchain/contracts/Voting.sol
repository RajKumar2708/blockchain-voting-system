// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    mapping(uint => uint) public votes;
    uint public totalVotes;

    event VoteCast(uint indexed partyId);

    function vote(uint partyId) public {
        votes[partyId]++;
        totalVotes++;
        emit VoteCast(partyId);
    }

    function getVotes(uint partyId) public view returns (uint) {
        return votes[partyId];
    }
}
