## Pricer Contract

### Context
Users can create their branded token economy through the OST dashboard. 
User does the following when creating and administering a BrandedToken.
- Define the OST to BT conversion rate.
- Define various transactions, which may include the following attributes:
  - Transaction Type (User to user, user to company, company to user).
  - Transaction Name.
  - Transaction Value is a fixed (in currency) or floating rate (in BT).
  - Transaction Commission in percentage (inclusive for user-to-company, exclusive for user-to-user).

### Requirements
- Pricer makes two `transferFrom` calls (for value and commission; less gas than repeated transfers).
- Pricer contract needs to be approved for a sufficient allowance on the account to spend (for both BT-valued and currency-valued transfers).
- In case of currency-valued payments, the amount of BT needed is determined on-chain (limited by allowance and by mechanism below).

### Specifications
- Pricer contract is OpsManaged.
- Every Pricer contract has one interface to a BrandedToken.
- Transaction to Pricer provides intended price point as parameter. If Oracle's price point is further than margin outside of intended price point, the transfer is not permitted. If within margin of Oracle price point, then Oracle price point is used
- This contract stores a BrandedToken address. This will be helpful to directly get the conversion rate and perform transfer functions.
- This contract stores the AcceptedMargin value for each currency. This specifies the absolute +/- range in currency value in which the price point from the PriceOracle will be accepted. Only ops will be able to update this value. The transaction will be performed only if the following condition will be true. Else it will result in a failed transaction.
<br> ```(IntendedPrice - AcceptedMargin) <= PricePoint from PriceOracle <=  (IntendedPrice + AcceptedMargin)```
- Because PriceOracle is instantiated for a currency value, this contract stores a PriceOracle address for each currency and allows adding/updating a PriceOracle for a currency value at any time. Only ops will be able to set/update this value.
- This contract makes two transferFrom calls. The amount to be transferred is in currency value if its a fixed transaction type, else its in branded token if its a floating type transaction.
- In case of fixed transaction type, this contract also validates for currency price point fluctuations. To achieve this, an intended price point is specified for pay transactions and this intended price point is validated against the current price point from the PriceOracle contract. The current price should be in acceptable range of intended price point.

### Details about the Pay functions.
Pay function is public. This function accepts beneficiary address and amount, commisionBeneficiary address and amount, currency type and intendedPricePoint.
On success, this function emits a `Payment` Event.
Currency type is bytes3 and:

- <b>can indicate a currency e.g "USD", "EUR", "ETH" ... etc:</b> <br/>
This means that the transactions are priced a currency value. 
This is a fixed value type transaction. 
This will get the price point from the price oracle contract. ` _transferAmount` and  `_commisionAmount` are in given in amounts reflecting their currency type i.e USD, EUR, ETH.. etc. 
This function calculates the equivalent branded tokens needed for transfer for a given currency value. 
The price point should be in acceptable range of the intended price point for the transaction to be successful.

- <b>can be empty, e.g "":</b><br/>
This means that the transactions are priced in branded tokens. 
This is a floating value type transaction. 
This will not get a price point from a PriceOracle contract.
`_transferAmount` and  `_commisionAmount` are in branded tokens.

The interface for pay function is as below.
```
function pay(
		address _beneficiary, 
		uint256 _transferAmount, 
		address _commissionBeneficiary, 
		uint256 _commissionAmount, 
		bytes3 _currency, 
		uint256 _intendedPricePoint) 
		public 
		returns (bool success);
```

### Details about the Accepted Margin.

The Accepted Margin for any currency can be updated in this contract. This can be only called by Ops.
This specifies the absolute +/- range in currency in which the price point will be accepted
For fixed transaction types, this value helps to validated that the transfer is done within an acceptable range of the intended price point.

The interface for this is as below
```
/// getter
function acceptedMargins(
		bytes3 _currency) 
		public 
		returns (uint64);
    
/// setter
function setAcceptedMargin(
		bytes3 _currency, 
		uint64 _acceptedMargin) 
		public 
		returns (bool);     
```

### Details about the Price Oracles.

This contract provides the flexibility to add, update, and unset a PriceOracle contract reference for a given currency type.
Price oracles are the contracts that provide the price of OST in a specific currency.

The interface for this is as below
```
/// getter
function priceOracles(
		bytes3 _currency) 
		public 
		returns (address);

/// setter
function setPriceOracle(
		bytes3 _currency, 
		address _oracleAddress) 
		public 
		returns (bool);

/// unsetter
function unsetPriceOracle(
		bytes3 _currency)
		public
		onlyOps
		returns (bool);
```

### Details about the currency value to number of Branded token conversions.
The amounts i.e ```_transferAmount``` and ```_commissionAmount``` are always in currency value amounts if currency is not "".
The conversion from currency value to amount of tokens is based on the following assumptions:
- The transfer amounts match the token decimals denomination provided by the PriceOracle (10^tokenDecimals, such as 10^18)
- The price point from the PriceOracle matches the token decimals denomination provided by the Price Oracle (10^tokenDecimals, such as 10^18)

```number of BT = (conversionRate * transferAmount * 10^tokenDecimals)/PricePoint```

