// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Project is Pausable, Ownable, ReentrancyGuard {
    mapping(address => Contribution) private contributions;

    string public projectId;

    ERC20 private token;

    struct Contribution {
        address lender;
        uint256 amount;
        uint256 repay;
        bool isset;
        bool repaid;
    }

    uint256 private totalContributed = 0;
    uint256 private immutable targetAmount;
    uint256 private immutable repayAmount;
    bool private repaid;
    bool private balanceWithdrawn;

    constructor(string memory _projectId, uint256 _amount, uint256 _repay, address _token) {
        projectId = _projectId;
        targetAmount = _amount;
        repayAmount = _repay;
        token = ERC20(_token);
    }

    function getProjectId() public view returns (string memory) {
        return projectId;
    }

    function deposit(uint256 _amount) public whenNotPaused nonReentrant   {
        uint256 allowance = token.allowance(msg.sender, address(this));

        require(totalContributed + allowance <= targetAmount, "deposit exceeds amount needed");

        bool success = token.transferFrom(msg.sender, address(this), _amount);

        if (success) {
            totalContributed += _amount;
            contributions[msg.sender].lender = msg.sender;
            contributions[msg.sender].amount += _amount;
        }
    }

    function ownerWithdrawBalance(address _to) public onlyOwner nonReentrant returns (bool) {
        balanceWithdrawn = token.transfer(_to, totalContributed);
        return balanceWithdrawn;
    }

    function repay() public whenNotPaused nonReentrant  {
        require(repaid, "project already repaid");
        require(token.allowance(msg.sender, address(this)) != repayAmount, "Invalid repayment amount");

        repaid = token.transferFrom(msg.sender, address(this), repayAmount);
    }

    function debug() public view returns(bool, uint256) {
        return (repaid, token.allowance(msg.sender, address(this)));
    }

    function claim() public whenNotPaused nonReentrant  {
        Contribution memory contribution = contributions[msg.sender];

        require(!repaid && !contribution.repaid, "contract has not been repaid or user already claimed funds");
        uint256 _repay = contribution.amount / totalContributed * repayAmount;

        contributions[msg.sender].repaid = true;
        contributions[msg.sender].repaid = token.transfer(msg.sender, _repay);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emptyBalance() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    receive() external payable {}
}