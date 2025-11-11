Feature: Ledger Cloud Purchase Module

  Scenario: Create and manage purchase flow with existing vendor
    Given the user has logged into Ledger Cloud
    When the user selects the business "STOCK HOLDING CORPORATION OF INDIA LIMITED"
    Then the Ledgers page should be displayed
    When the user creates a purchase order for supplier "" with item ""
   And the user converts that purchase order into a purchase bill
   Then check the status of the purchase order in the manage page should be "Converted"
    And check the search, sort, pagination and filter functionality in the manage purchase order page should be working
 Then check the delete functionality by deleting the created purchase order and check the purchase order is deleted from the list


  Scenario: Create and manage purchase flow with new vendor
    Given the user has logged into Ledger Cloud
    When the user selects the business "STOCK HOLDING CORPORATION OF INDIA LIMITED"
    Then the Ledgers page should be displayed
    When the user creates a purchase order for supplier "New Vendor Test" with item "item1"
    #And the user converts that purchase order into a purchase bill
    #And the user reconciles the purchase bill with a payment voucher
    #Then the purchase order status should be "Converted"
    #And the purchase bill status should be "Paid"

  Scenario: Verify GSTIN error when GSTIN is associated with another vendor
    Given the user has logged into Ledger Cloud
    When the user selects the business "STOCK HOLDING CORPORATION OF INDIA LIMITED"
    Then the Ledgers page should be displayed
    When the user attempts to create a purchase order for supplier "Duplicate GSTIN Vendor" with GSTIN "33AAHFJ0166D1ZU"
    Then an error message should be displayed indicating the GSTIN is already associated with another vendor

  #Scenario: Create debit note and verify fully settled purchase bill
  #  Given the user has logged into Ledger Cloud
  #  When the user creates a debit note for the purchase bill
   # Then the purchase bill status should be "Fully Settled"
