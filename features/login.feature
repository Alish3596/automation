Feature: Ledger Cloud Login

  Scenario: Login with valid credentials
    Given the user is on the Ledger Cloud login page
    When the user enters email "alisha.fathima@indiafilings.com" and password "Alisha@123"
    And clicks the Continue button
    Then the login should be "success"

  Scenario: Login with invalid credentials
    Given the user is on the Ledger Cloud login page
    When the user enters email "wrong.user@example.com" and password "wrongpass"
    And clicks the Continue button
    Then the login should be "failure"
