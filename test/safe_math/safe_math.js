const BN = require('bn.js');
const SafeMathTest = artifacts.require('SafeMathTest');
const utils = require('../test_lib/utils');

let safeMath;
contract('SafeMath', function () {
	const MAX_UINT = new BN(2).pow(new BN(256)).sub(new BN(1));
	
	beforeEach(async function () {
		
		safeMath = await SafeMathTest.new();
		
	});
	
	describe('add', function () {
		it('adds correctly', async function () {
			const a = new BN(5678);
			const b = new BN(1234);
			assert((await safeMath.add.call(a,b)).eq(a.add(b)));
		});
		
		it('throws a revert error on addition overflow', async function () {
			const a = MAX_UINT;
			const b = new BN(1);
			await utils.expectRevert(safeMath.add(a, b));
		});
	});

	describe('sub', function () {
		it('subtracts correctly', async function () {
			const a = new BN(5678);
			const b = new BN(1234);
			assert((await safeMath.sub.call(a, b)).eq(a.sub(b)));
		});

		it('throws a revert error if subtraction result would be negative', async function () {
			const a = new BN(1234);
			const b = new BN(5678);

			await utils.expectRevert(safeMath.sub.call(a, b));
		});
	});

	describe('mul', function () {
		it('multiplies correctly', async function () {
			const a = new BN(1234);
			const b = new BN(5678);
			
			assert((await safeMath.mul.call(a, b)).eq(a.mul(b)));
		});

		it('handles a zero product correctly', async function () {
			const a = new BN(0);
			const b = new BN(5678);
			
			assert((await safeMath.mul.call(a,b)).eq(a.mul(b)));
		});

		it('throws a revert error on multiplication overflow', async function () {
			const a = MAX_UINT;
			const b = new BN(2);

			await utils.expectRevert(safeMath.mul(a, b));
		});
	});

	describe('div', function () {
		it('divides correctly', async function () {
			const a = new BN(5678);
			const b = new BN(5678);

		 assert((await safeMath.div.call(a,b)).eq(a.div(b)));
		});

		it('throws a revert error on zero division', async function () {
			const a = new BN(5678);
			const b = new BN(0);
			
			await utils.expectRevert(safeMath.div(a, b));
		});
	});

	describe('mod', function () {
		describe('modulos correctly', async function () {
			it('when the dividend is smaller than the divisor', async function () {
				const a = new BN(284);
				const b = new BN(5678);
				
				assert((await safeMath.mod.call(a,b)).eq(a.mod(b)));
			});

			it('when the dividend is equal to the divisor', async function () {
				const a = new BN(5678);
				const b = new BN(5678);
				
				assert((await safeMath.mod.call(a,b)).eq(a.mod(b)));
			});

			it('when the dividend is larger than the divisor', async function () {
				const a = new BN(7000);
				const b = new BN(5678);
				
				assert((await safeMath.mod.call(a,b)).eq(a.mod(b)));
			});

			it('when the dividend is a multiple of the divisor', async function () {
				const a = new BN(17034); // 17034 == 5678 * 3
				const b = new BN(5678);
				
				assert((await safeMath.mod.call(a,b)).eq(a.mod(b)));
			});
		});

		it('reverts with a 0 divisor', async function () {
			const a = new BN(5678);
			const b = new BN(0);

			await utils.expectRevert(safeMath.mod(a, b));
		});
	});

});