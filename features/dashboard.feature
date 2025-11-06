Feature: Select Business and Open Ledgers

  Scenario: Select specific business and open its ledgers
    Given the user has logged into Ledger Cloud
    When the user selects the business "STOCK HOLDING CORPORATION OF INDIA LIMITED"
    Then the Ledgers page should be displayed
