## Pricer Contract

### Context
Member companies can create their branded token economy through the OST dashboard. 
Member company does the following when they mint the Branded Token.
- Define the OST to BT conversion rate.
- Define various transactions which includes the following.
  - Transaction Type (User to user, user to company, company to user).
  - Transaction Name.
  - Transaction Value is at fixed rate (in currency/fiat) or floating rate (in BT).
  - Transaction Commission in percentage (inclusive for user-to-company, exclusive for user-to-user).

### Requirements
- Pricer makes two  ```transferFrom``` calls.
- Pricer contract needs to be set a sufficient allowance on the account to spend (for both BT-valued and fiat-valued transfers).
- Cheaper gas than repeated transfers.
- In case of fiat-valued transfer the amount of BT needed is determined on-chain (limited by allowance and by mechanism below).

### Specifications
- Pricer Contract is OpsManaged.
- Every Pricer contract has one interface to a Branded Token.
- Transaction to Pricer provides intended price point as parameter. If intended price point is further than margin outside of Oracle’s price point then transfer fails. If within margin of Oracle price point then Oracle price point is used
- This contract stores Branded Token address. This will be helpful to directly get the conversion rate and perform transfer functions.
- This contract stores the AcceptedMargin value for each currency. This specifies the absolute +/- range in currency value in which the price point from the PriceOracle will be accepted. Only ops will be able to update this value. The transaction will be performed only if the following condition will be true. Else it will result in to failed transaction.
<br> ```(IntendedPrice - AcceptedMargin) <= PricePoint from PriceOracle <=  (IntendedPrice + AcceptedMargin)```
- This contract stores the PriceOracle address for each currency. PriceOracle is instanced for a fiat value. This will allow to add support of adding new fiat value at any time. Only ops will be able to set/update this value.
- This contract makes two transferFrom calls. The amount to be transferred is in currency value if its a fixed transaction type, else its in Branded token if its a floating type transaction.
- In case of fixed transaction type, this contract also validates for currency price point fluctuations. To achieve this and intended price point is specified while making transfers and this intended price point is validated against the current price point from the PriceOracle contract. The current price should be in acceptable range of intended price point.

### Details about the Pay functions.
Pay function is public. This function accepts beneficiary address and its amount, commisionBeneficiary address and its amount, Currency type and intendedPricePoint.
On successful transfer this function emits PaymentComplete Event.
Currency type can have the following value.

- <b>Currency type can be byte3 value e.g USD, EUR, ETH ... etc:</b> <br/>
This means that the transactions are happening in USD, EUR, ETH Fiat value. 
This is a fixed value type transaction. 
This will get the price point from the price oracle contract.``` _transferAmount``` and  ```_commisionAmount``` are in given currency type i.e USD, EUR, ETH.. etc. 
This function calculate the equivalent branded tokens needed for transfer for a given currency value. 
The price point value should be in acceptable range of intendedPricePoint for transaction to be successful.

- <b>Currency type with no value e.g "":</b><br/>
This means that the transactions are happening in BrandedToken. 
This is a floating value type transaction. 
This will not get Price point from Price oracle contract.
```_transferAmount``` and  ```_commisionAmount``` are in BrandedTokens.

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
This specifies the absolute +/- range in fiat in which the Price point will be accepted
For fixed transaction types, this value helps to validated that if the transfer is done within the range of intended price point.

The interface for this is as below
```
// getter
function acceptedMargins(
		bytes3 _currency) 
		public 
		returns (uint64);
    
// setter
function setAcceptedMargin(
		bytes3 _currency, 
		uint64 _acceptedMargin) 
		public 
		returns (bool);     
```

### Details about the Price Oracles.

This contract provides the flexibility to add, remove or update a PriceOracle contract reference for a given currency type.
Price Oracles are the contracts that determines the price of OST and is derived from tracking its value across all exchanges globally.

The interface for this is as below
```
// getter
function priceOracles(
		bytes3 _currency) 
		public 
		returns (address);

// setter
function setPriceOracle(
		bytes3 _currency, 
		address _oracleAddress) 
		public 
		returns (bool);
```

### Details about the currency value to number of Branded token conversions.
The amounts i.e ```_transferAmount``` and ```_commissionAmount``` are always in currency value (If currency is not "").
The conversion from currency value to number of tokens is based on the following assumptions.
- The Transfer amounts are in wei (10^18)
- The Price point from the Price Oracle is in wei (10^18)
- The number of Branded token is also in wei.

```number of BT = (conversionRate * transferAmount * 10^18)/PricePoint```

