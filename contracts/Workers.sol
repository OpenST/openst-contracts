pragma solidity ^0.4.17;

// Copyright 2018 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
// Utility chain: Workers
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./OpsManaged.sol";
import "./SafeMath.sol";

/// A set of authorised workers
contract Workers is OpsManaged {
	using SafeMath for uint256;

	/*
	 *  Storage
	 */
	/// workers are active up unto the deactivation height
	mapping(address => uint256 /* deactivation height */) public workers;

	/*
	 *  Public functions
	 */
	function Workers()
		public
		OpsManaged()
	{
	}

	function setWorker(
		address _worker,
		uint256 _deactivationHeight)
		external
		onlyOps
		returns (uint256 /* remaining activation length */)
	{
		require(_deactivationHeight >= block.number);

		workers[_worker] = _deactivationHeight;

		return (_deactivationHeight - block.number);
	}

	function removeWorker(
		address _worker)
		external
		onlyOps
		returns (bool existed)
	{
		existed = (workers[_worker] > 0);

		delete workers[_worker];

		return existed;
	}

	// clean up or collectively revoke all workers
	function remove()
		external
		onlyAdminOrOps
	{
		selfdestruct(msg.sender);
	}

	/*
	 *  Public view functions
	 */
	function isWorker(
		address _worker)
		external
		view
		returns (bool /* is active worker */)
	{
		return (workers[_worker] >= block.number);
	}

}