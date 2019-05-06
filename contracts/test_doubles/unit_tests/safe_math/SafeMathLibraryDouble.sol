pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * It is used to test SafeMath contract.
 */
contract SafeMathLibraryDouble {

    /* Public Functions */

    /** @dev Multiplies two numbers, reverts on overflow.*/
    function mul(uint256 a, uint256 b)
        public
        pure
        returns (uint256)
    {
        return SafeMath.mul(a,b);
    }

    /**
     * @dev Integer division of two numbers truncating the quotient,
     *      reverts on division by zero.
     */
    function div(uint256 a, uint256 b)
        public
        pure
        returns (uint256)
    {
        return SafeMath.div(a,b);
    }

    /**
     * @dev Subtracts two numbers, reverts on overflow (i.e. if subtrahend
     *      is greater than minuend).
     */
    function sub(uint256 a, uint256 b)
        public
        pure
        returns (uint256)
    {
        return SafeMath.sub(a,b);
    }

    /**
     * @dev Adds two numbers, reverts on overflow.
     */
    function add(uint256 a, uint256 b)
        public
        pure
        returns (uint256)
    {
        return SafeMath.add(a,b);
    }

    /**
     * @dev Divides two numbers and returns the remainder (unsigned integer
     *      modulo), reverts when dividing by zero.
     */
    function mod(uint256 a, uint256 b)
        public
        pure
        returns (uint256)
    {
        return SafeMath.mod(a,b);
    }

}
