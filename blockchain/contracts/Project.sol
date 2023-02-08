// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Project is Pausable, Ownable, ReentrancyGuard {
    mapping(address => Contribution) private contributions;

    struct Contribution {
        address lender;
        uint amount;
        uint repay;
        bool isset;
    }

    uint private immutable amount;
    uint private immutable repayAmount;
    bool private repaid;

    constructor(uint _amount, uint _repay) {
        amount = _amount;
        repayAmount = _repay;
    }

    function deposit(uint amountToRepay) public payable whenNotPaused nonReentrant   {
        require(amount <= address(this).balance + msg.value, "deposit exceeds amount needed");

        contributions[msg.sender].lender = msg.sender;
        contributions[msg.sender].amount += msg.value;
        contributions[msg.sender].repay = amountToRepay;
    }

    function repay() public payable whenNotPaused nonReentrant  {
        require(repaid, "project already repaid");
        require(msg.value == repayAmount, "Invalid repayment amount");
        repaid = true;
    }

    function claim(uint amountToWithdraw) public payable whenNotPaused nonReentrant  {
        require(repaid, "contract has not been paid");
        require(contributions[msg.sender].amount <= amountToWithdraw, "Insufficient Funds");

        contributions[msg.sender].amount -= amountToWithdraw;
        bool sent = payable(msg.sender).send(amountToWithdraw);
        require(sent, "Failed to Complete");
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    receive() external payable {}
}