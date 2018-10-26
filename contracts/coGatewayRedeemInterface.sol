pragma solidity ^0.4.23;

contract coGatewayRedeemInterface {

    function isActivated() external returns (bool);
    function bounty() external returns (uint256);


    function redeem(
		uint256 _amount,
		address _beneficiary,
		address _facilitator,
		uint256 _gasPrice,
		uint256 _gasLimit,
		uint256 _nonce,
		bytes32 _hashLock
	)
		public
		payable
		returns (bytes32 messageHash_);

	function processRedemption(
		bytes32 _messageHash,
		bytes32 _unlockSecret
	)
		external
		returns (uint256 redeemAmount);

	function processRedemptionWithProof(
		bytes32 _messageHash,
		bytes _rlpEncodedParentNodes,
		uint256 _blockHeight,
		uint256 _messageStatus
	)
		external
		returns (uint256 redeemAmount);

	function revertRedemption(
		bytes32 _messageHash
	)
		payable
		external
		returns (
			address redeemer_,
			uint256 redeemerNonce_,
			uint256 amount_
		);

	function processRevertRedemption(
		bytes32 _messageHash,
		uint256 _blockHeight,
		bytes _rlpEncodedParentNodes
	)
		external
		returns (bool /*TBD*/);

}
