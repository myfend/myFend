// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Project.sol";

contract Deployer is Pausable, Ownable, ReentrancyGuard {
    mapping(string => address) private projects;
    address private token;

    constructor(address _token) {
        token = _token;
    }

    function deployProject(string memory projectId, uint _amount, uint _repay) public onlyOwner returns (address) {
        Project project = new Project(projectId, _amount, _repay, token);
        address contractAddress = address(project);

        projects[projectId] = contractAddress;

        return contractAddress;
    }

    function withdrawBalance(address _from, address _to) public onlyOwner returns (bool) {
        Project _project = Project(payable(_from));
        return _project.ownerWithdrawBalance(_to);
    }

    function projectAddress(string memory _projectId) public view returns (address) {
        return projects[_projectId];
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function emptyBalance() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
     }

    receive() external payable {}
}