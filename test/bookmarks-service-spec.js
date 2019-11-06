const BookmarkService = require("../src/bookmark-service");
const knex = require("knex");
const app = require("../src/app");
const fixtures = require("./bookmarks-fixtures");
const token = process.env.API_TOKEN;

describe(`Bookmarks service object`, function() {
  let db;
  before(() => {
    db = knex({
      client: "pg",
      connection: process.env.DB_TEST_URL
    });
    app.set("db", db);
  });

  after(() => db.destroy());

  before(() => db("bookmarks").truncate());

  afterEach(() => db("bookmarks").truncate());

  context(`Given 'bookmarks' has no data`, () => {
    it(`getAllItems() resolves an empty array`, () => {
      return BookmarkService.getAllBookmarks(db).then(actual => {
        expect(actual).to.eql([]);
      });
    });
    it(`responds with 200 and an empty list`, () => {
      return supertest(app)
        .get("/api/bookmarks")
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .expect(200, []);
    });
    it(`creates an bookmark, responding with a 201 and the new bookmark`, function() {
      const newBookmark = {
        title: "New Test Bookmark",
        url: "https://www.youtube.com/",
        description: "A video streaming platform.",
        rating: 3
      };
      return supertest(app)
        .post("/api/bookmarks")
        .send(newBookmark)
        .set("Authorization", "bearer " + token)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body).to.have.property("id");
        })
        .then(res =>
          supertest(app)
            .get(`/api/bookmarks/${res.body.id}`)
            .set("Authorization", "bearer " + token)
            .expect(res.body)
        );
    });
  });
  context(`Given 'bookmarks has data`, () => {
    const testBookmarks = fixtures.makeBookmarksArray();

    beforeEach("insert bookmarks", () => {
      return db.into("bookmarks").insert(testBookmarks);
    });
    it("responds with 200 and the specified bookmark", () => {
      const bookmarkId = 2;
      const expectedBookmark = testBookmarks[bookmarkId - 1];
      return supertest(app)
        .get(`/api/bookmarks/${bookmarkId}`)
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .expect(200, expectedBookmark);
    });
    context(`Given an XSS attack bookmark`, () => {
      const {
        maliciousBookmark,
        expectedBookmark
      } = fixtures.makeMaliciousBookmark();

      beforeEach("insert malicious bookmark", () => {
        return db.into("bookmarks").insert([maliciousBookmark]);
      });

      it("removes XSS attack content", () => {
        return supertest(app)
          .get(`/api/bookmarks/${maliciousBookmark.id}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedBookmark.title);
            expect(res.body.description).to.eql(expectedBookmark.description);
          });
      });
    });
  });
  describe("DELETE /api/bookmarks/:id", () => {
    context(`Given no bookmarks`, () => {
      it(`responds 404 whe bookmark doesn't exist`, () => {
        return supertest(app)
          .delete(`/api/bookmarks/123`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Bookmark Not Found` }
          });
      });
    });
  });
  describe(`PATCH /api/bookmarks/:id`, () => {
    context(`No Bookmarks in database`, () => {
      it(`responds with a 404 when there is no data`, () => {
        const id = 32;
        return supertest(app)
          .patch(`/api/bookmarks/${id}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `Bookmark Not Found` } });
      });
    });
    context(`Test Bookmarks in database`, () => {
      const testBookmarks = fixtures.makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it(`Successful update responds with 204 and updates the bookmark`, () => {
        const idToUpdate = 2
        const updateBookmark = {
          title: "Updated testing bookmark",
          url: "https://www.youtube.com/",
          description: 'Updated description for testing bookmark PATCH',
          rating: 4,
        }
        const expectedArticle = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        }
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(updateBookmark)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedArticle)
          )
      })
      
      it(`Updating spesific values responds with a 204 and updates the specified values`, () => {
        const idToUpdate = 1
        const updateBookmark = {
          title: 'Updated title for testing a single updated paramiter',
        }
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        }
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({
            ...updateBookmark,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedBookmark)
          )
      })
    });
  });
});
