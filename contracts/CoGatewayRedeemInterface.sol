pragma solidity ^0.4.23;

contract CoGatewayRedeemInterface {

	/* Public functions */

	/**
     * @notice Initiates the redemption process.
     *
     * @dev In order to redeem the redeemer needs to approve CoGateway contract
     *      for redeem amount. Redeem amount is transferred from redeemer
     *      address to CoGateway contract.
     *      This is a payable function. The bounty is transferred in base token
     *      Redeemer is always msg.sender
     *
     *		Update redeem signature after _facilitator argument is removed
     *      from CoGateway.redeem in mosaic-contracts.
     *
     * @param _amount Redeem amount that will be transferred form redeemer
     *                account.
     * @param _beneficiary The address in the origin chain where the value
     *                     tok ens will be released.
     * @param _facilitator Facilitator address.
     * @param _gasPrice Gas price that redeemer is ready to pay to get the
     *                  redemption process done.
     * @param _gasLimit Gas limit that redeemer is ready to pay
     * @param _nonce Nonce of the redeemer address.
     * @param _hashLock Hash Lock provided by the facilitator.
     *
     * @return messageHash_ which is unique for each request.
     */
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

	/**
     * @notice Revert redemption to stop the redeem process. Only redeemer can
     *         revert redemption by providing penalty i.e. 1.5 times of
     *         bounty amount. On revert process, penalty and facilitator
     *         bounty will be burned.
     *
     * @param _messageHash Message hash.
     *
     * @return redeemer_ Redeemer address
     * @return redeemerNonce_ Redeemer nonce
     * @return amount_ Redeem amount
     */
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
}
