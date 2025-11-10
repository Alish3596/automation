Feature: Ledger Cloud Purchase Module

  Scenario: Create and manage purchase flow
    Given the user has logged into Ledger Cloud
    When the user selects the business "STOCK HOLDING CORPORATION OF INDIA LIMITED"
    Then the Ledgers page should be displayed
    When the user creates a purchase order for supplier "grace super market" with item "item1"
    #And the user converts that purchase order into a purchase bill
    #And the user reconciles the purchase bill with a payment voucher
    #Then the purchase order status should be "Converted"
    #And the purchase bill status should be "Paid"

  Scenario: Create debit note and verify fully settled purchase bill
    Given the user has logged into Ledger Cloud
    When the user creates a debit note for the purchase bill
    Then the purchase bill status should be "Fully Settled"
