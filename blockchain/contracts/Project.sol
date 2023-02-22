// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Project is Pausable, Ownable, ReentrancyGuard {
    mapping(address => Contribution) private contributions;

    bool public constant interfaceSupported = true;

    ERC20 private token;

    struct Contribution {
        address lender;
        uint256 amount;
        uint256 repay;
        bool isset;
        bool repaid;
    }

    uint256 private immutable amount;
    uint256 private immutable repayAmount;
    bool private repaid;

    constructor(uint256 _amount, uint256 _repay, address _token) {
        amount = _amount;
        repayAmount = _repay;
        token = ERC20(_token);
    }

    function deposit(uint256 amountToRepay) public whenNotPaused nonReentrant   {
        uint256 _amount = token.allowance(msg.sender, address(this));

        require(amount <= address(this).balance + _amount, "deposit exceeds amount needed");
        require(_amount >= amountToRepay, "Approve right amount");

        bool success = token.transferFrom(msg.sender, address(this), amountToRepay);

        if (success) {
            contributions[msg.sender].lender = msg.sender;
            contributions[msg.sender].amount += _amount;
            contributions[msg.sender].repay = amountToRepay;
        }
    }

    function repay() public whenNotPaused nonReentrant  {
        require(repaid, "project already repaid");
        require(token.allowance(msg.sender, address(this)) == repayAmount, "Invalid repayment amount");

        repaid = token.transferFrom(msg.sender, address(this), repayAmount);
    }

    function claim() public whenNotPaused nonReentrant  {
        Contribution memory contribution = contributions[msg.sender];

        require(!contribution.repaid, "contract has been paid");

        contributions[msg.sender].repaid = true;
        contributions[msg.sender].repaid = token.transfer(msg.sender, contribution.repay);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}