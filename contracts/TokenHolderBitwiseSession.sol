pragma solidity ^0.4.23;

contract TokenHolder {
    bytes32 secret;
    mapping(address => bool) devices;
    uint256 consumedNonces;
    uint128 currentAllowedNonces;

    function addDevice(address device) returns (bool){
        devices[device] = true;
        return true;
    }


    function startSession(bytes32 sessionSecret) returns (bool){
        secret = sessionSecret;
        return true;
    }

    function validateSession_1(bytes32 newScret) returns (bool){
        require(keccak256(newScret) == secret);
        secret = newScret;
        return true;
    }

    event Test(bytes32 msg, bytes32 created);

    function validateSession_2(bytes32 msgHash, uint8 v, bytes32 r, bytes32 s, uint256 nonce) returns (bool) {
        bytes32 message = prefixed(keccak256(abi.encodePacked((uint256(nonce)))));

        address _addr = ecrecover(msgHash, v, r, s);
        require(msgHash == message);
        require(devices[_addr] == true);

        //check nonce should be greater than 0
        require(nonce > 0);
        //check for consumed nonces
        require(consumedNonces < 128 || consumedNonces < nonce);

        //Rotate consumed nonces
        if (nonce > (consumedNonces + 128)) {
            consumedNonces = consumedNonces + 128;
            currentAllowedNonces = 0;
        }
        //Bring nonce in range of 0-127
        nonce = nonce % 128;
        //check if current bit is consumed
        require((currentAllowedNonces & (1 << nonce)) == 0);
        //set bit which is consumed
        currentAllowedNonces = currentAllowedNonces | (1 << (nonce-1));

        return true;
    }

    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

}