const BigNumber = require('bn.js');
const SafeMathTest = artifacts.require('SafeMathTest');
const utils = require('../test_lib/utils');

let safeMathInstance;
contract('SafeMath', function () {
	const MAX_UINT = new BigNumber(2).pow(new BigNumber(256)).sub(new BigNumber(1));
	
	beforeEach(async function () {
		
		safeMathInstance = await SafeMathTest.new();
		
	});
	
	describe('add', function () {
		it('adds correctly', async function () {
			const a = new BigNumber(5678);
			const b = new BigNumber(1234);
			assert((await safeMathInstance.add.call(a,b)).eq(a.add(b)));
		});
		
		it('throws a revert error on addition overflow', async function () {
			const a = MAX_UINT;
			const b = new BigNumber(1);
			await utils.expectRevert(safeMathInstance.add(a, b));
		});
	});

	describe('sub', function () {
		it('subtracts correctly', async function () {
			const a = new BigNumber(5678);
			const b = new BigNumber(1234);
			assert((await safeMathInstance.sub.call(a, b)).eq(a.sub(b)));
		});

		it('throws a revert error if subtraction result would be negative', async function () {
			const a = new BigNumber(1234);
			const b = new BigNumber(5678);

			await utils.expectRevert(safeMathInstance.sub.call(a, b));
		});
	});

	describe('mul', function () {
		it('multiplies correctly', async function () {
			const a = new BigNumber(1234);
			const b = new BigNumber(5678);
			
			assert((await safeMathInstance.mul.call(a, b)).eq(a.mul(b)));
		});

		it('handles a zero product correctly', async function () {
			const a = new BigNumber(0);
			const b = new BigNumber(5678);
			
			assert((await safeMathInstance.mul.call(a,b)).eq(a.mul(b)));
		});

		it('throws a revert error on multiplication overflow', async function () {
			const a = MAX_UINT;
			const b = new BigNumber(2);

			await utils.expectRevert(safeMathInstance.mul(a, b));
		});
	});

	describe('div', function () {
		it('divides correctly', async function () {
			const a = new BigNumber(5678);
			const b = new BigNumber(5678);

		 assert((await safeMathInstance.div.call(a,b)).eq(a.div(b)));
		});

		it('throws a revert error on zero division', async function () {
			const a = new BigNumber(5678);
			const b = new BigNumber(0);
			
			await utils.expectRevert(safeMathInstance.div(a, b));
		});
	});

	describe('mod', function () {
		describe('modulos correctly', async function () {
			it('when the dividend is smaller than the divisor', async function () {
				const a = new BigNumber(284);
				const b = new BigNumber(5678);
				
				assert((await safeMathInstance.mod.call(a,b)).eq(a.mod(b)));
			});

			it('when the dividend is equal to the divisor', async function () {
				const a = new BigNumber(5678);
				const b = new BigNumber(5678);
				
				assert((await safeMathInstance.mod.call(a,b)).eq(a.mod(b)));
			});

			it('when the dividend is larger than the divisor', async function () {
				const a = new BigNumber(7000);
				const b = new BigNumber(5678);
				
				assert((await safeMathInstance.mod.call(a,b)).eq(a.mod(b)));
			});

			it('when the dividend is a multiple of the divisor', async function () {
				const a = new BigNumber(17034); // 17034 == 5678 * 3
				const b = new BigNumber(5678);
				
				assert((await safeMathInstance.mod.call(a,b)).eq(a.mod(b)));
			});
		});

		it('reverts with a 0 divisor', async function () {
			const a = new BigNumber(5678);
			const b = new BigNumber(0);

			await utils.expectRevert(safeMathInstance.mod(a, b));
		});
	});

});