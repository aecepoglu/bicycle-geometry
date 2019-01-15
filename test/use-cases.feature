Scenario: open up the website
	Given I have 2 bikes in the DB
	When I open the website
	Then I should see the illustrations of 2 bikes
	And I should see 2 tabs for bikes with colors corresponding to the colors in the illustratios
	And one of the tabs is active
	And I should see the input fields for the active bike
	And the templates list is populated with 2 bikes in the DB

Feature: Removing bikes
	Scenario: Remove the last bike
		Given I have 2 bikes
		When I select the 2nd bike
		And I click the button "X"
		Then I should have 1 bike
		And the bike 1 should be active
	
	Scenario: Can't remove the only bike
		Given I have 1 bike
		Then the button "X" should be disabled
	
	Scenario: Remove the middle bike
		Given I have 3 bikes
		When I select the 2nd bike
		And I click the button "X"
		Then I should have 2 bikes
		And the bike 2 should be active

Feature: Editing bikes
	Scenario: viewing guides
		Given I am viewing a bike
		When I focus an input field
		Then a guide corresponding to that field should show

	Scenario: viewing errors
		Given I am viewing a bike that is custom
		When I edit an input field erronously
		Then I should see an error underneath the input field

	Scenario: switch to non-custom template if editing a pristine template
		Given I am viewing a bike
		When I edit an input field
		Then I should get a warning
	
	Scenario: editing measurements
		Given I am viewing a bike
		When I edit an input field
		Then the measurements in the illustration should change accordingly
	
	Scenario: changing colors
		Given I am viewing a bike
		When I change the color field
		Then the color of the illustration should change

Feature: see ghosts
	Scenario: see ghost of bikes
		Given I have 2 bikes
		And bike 1 has "ghost" enabled
		And bike 2 has "ghost" disabled
		When I view bike 2
		Then I should see bike 2
		And I should see ghost of bike 1

Feature: add new bike
	Scenario: add clone of cur bike
		Given I have 2 bikes
		And bike 2 is active
		When I click "+"
		Then I should have 2 bikes
		And bike 3 should be a clone of bike 2
