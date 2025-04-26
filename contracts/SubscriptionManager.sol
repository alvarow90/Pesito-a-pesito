// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SubscriptionManager
 * @dev Contract for managing subscriptions to Pesito a Pesito service
 */
contract SubscriptionManager {
    address public owner;
    
    // Cost per month in wei (0.01 test ETH)
    uint256 public monthlySubscriptionPrice = 10000000000000000;
    
    // Subscription details
    struct Subscription {
        bool isActive;
        uint256 expirationTimestamp;
    }
    
    // Mapping from user address to subscription details
    mapping(address => Subscription) public subscriptions;
    
    // Events
    event SubscriptionPurchased(address indexed subscriber, uint256 expiration);
    event SubscriptionCancelled(address indexed subscriber);
    event PriceChanged(uint256 newPrice);
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Modifier to restrict function to contract owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev Purchase a subscription for one month
     */
    function purchaseSubscription() external payable {
        require(msg.value >= monthlySubscriptionPrice, "Insufficient payment");
        
        // Calculate expiration (current time + 30 days)
        uint256 expiration;
        
        if (subscriptions[msg.sender].isActive && 
            subscriptions[msg.sender].expirationTimestamp > block.timestamp) {
            // Extend existing subscription
            expiration = subscriptions[msg.sender].expirationTimestamp + 30 days;
        } else {
            // New subscription
            expiration = block.timestamp + 30 days;
        }
        
        subscriptions[msg.sender] = Subscription({
            isActive: true,
            expirationTimestamp: expiration
        });
        
        emit SubscriptionPurchased(msg.sender, expiration);
        
        // Refund extra payment if any
        uint256 refund = msg.value - monthlySubscriptionPrice;
        if (refund > 0) {
            payable(msg.sender).transfer(refund);
        }
    }
    
    /**
     * @dev Cancel a subscription
     */
    function cancelSubscription() external {
        require(subscriptions[msg.sender].isActive, "No active subscription");
        
        subscriptions[msg.sender].isActive = false;
        
        emit SubscriptionCancelled(msg.sender);
    }
    
    /**
     * @dev Check if an address has an active subscription
     */
    function hasActiveSubscription(address subscriber) external view returns (bool) {
        return subscriptions[subscriber].isActive && 
               subscriptions[subscriber].expirationTimestamp > block.timestamp;
    }
    
    /**
     * @dev Get subscription details for an address
     */
    function getSubscriptionDetails(address subscriber) external view returns (bool isActive, uint256 expiration) {
        Subscription memory sub = subscriptions[subscriber];
        return (sub.isActive && sub.expirationTimestamp > block.timestamp, sub.expirationTimestamp);
    }
    
    /**
     * @dev Change subscription price (only owner)
     */
    function setSubscriptionPrice(uint256 newPrice) external onlyOwner {
        monthlySubscriptionPrice = newPrice;
        emit PriceChanged(newPrice);
    }
    
    /**
     * @dev Withdraw funds from contract (only owner)
     */
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}