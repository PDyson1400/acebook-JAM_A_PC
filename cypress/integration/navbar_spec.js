describe("Navbar", () => {
    it("can navigate from welcome page to sign up and login", () => {
        cy.task("wipe_database");

        // login
        cy.visit("/");
        cy.get('[href="/sessions/new"]').click();
        cy.url().should("contain","/sessions/new")

        // sign up
        cy.visit("/");
        cy.get('[href="/users/new"]').click();
        cy.url().should("contain","/users/new")

        // click from sign up to log in
        cy.get('a').click()
        cy.url().should("contain","/sessions/new")

        // from log in to sign up
        cy.get('a').click()
        cy.url().should("contain","/users/new")

        // actually sign up
        cy.get("#email").type("tester@email.com");
        cy.get("#password").type("password123");
        cy.get("#submit").click();

        // actually log in
        cy.visit("/sessions/new");
        cy.get("#email").type("tester@email.com");
        cy.get("#password").type("password123");
        cy.get("#submit").click();

    });

    it("Navbar on home screen", () => {
        // actually log in
        cy.visit("/sessions/new");
        cy.get("#email").type("tester@email.com");
        cy.get("#password").type("password123");
        cy.get("#submit").click();

        // click each of the links on home, and assert that we are on the correct page
        //before going back and clicking the next one
        cy.get('.home').click();
        cy.url().should("contain","/posts");

        cy.get('img').click();
        cy.url().should("contain","/users");
        cy.go('back');

        cy.get(':nth-child(3) > a').click();
        cy.url().should("contain","/users");
        cy.go('back');

        cy.get('.new-post-link').click();
        cy.url().should("contain","/posts/new");
        cy.go('back');

        cy.get(':nth-child(5) > form > input').click()
        cy.url().should("contain","/sessions/new")
    });

    it("cannot nav when not logged in", () => {

        cy.visit("/");

        cy.visit("/posts");
        cy.url().should("contain","/sessions/new")

        cy.visit("/posts/new");
        cy.url().should("contain","/sessions/new")

    });
});