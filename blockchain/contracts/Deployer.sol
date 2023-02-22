// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Project.sol";

contract Deployer is Pausable, Ownable, ReentrancyGuard {
    address[] private projects;
    address private token;

    constructor(address _token) {
        token = _token;
    }

    function deployProject(uint _amount, uint _repay) public returns (address) {
        Project project = new Project(_amount, _repay, token);
        address contractAddress = address(project);

        projects.push(contractAddress);

        return contractAddress;
    }

    function lastProject() public view returns (address) {
        return projects[projects.length - 1];
    }

    function pause() public onlyOwner {
        for (uint i = 0; i < projects.length; i++) {
            Project(projects[i]).pause();
        }
        
        _pause();
    }

    function unpause() public onlyOwner {
        for (uint i = 0; i < projects.length; i++) {
            Project(projects[i]).unpause();
        }

        _unpause();
    }

}