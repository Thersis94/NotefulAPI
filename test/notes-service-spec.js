const NotesService = require("../src/Notes/notes-service");
const knex = require("knex");
const app = require("../src/app");
const fixtures = require("./notes-fixtures");

describe(`Notes service object`, function() {
  let db;
  before(() => {
    db = knex({
      client: "pg",
      connection: process.env.DATABASE_TEST_URL
    });
    app.set("db", db);
  });

  after(() => db.destroy());

  before(() => db("notes").truncate());

  afterEach(() => db("notes").truncate());

  context(`Given 'notes' has no data`, () => {
    it(`getAllNotes() resolves an empty array`, () => {
      return NotesService.getAllNotes(db).then(actual => {
        expect(actual).to.eql([]);
      });
    });
    it(`responds with 200 and an empty list`, () => {
      return supertest(app)
        .get("/api/notes")
        .expect(200, []);
    });
  });
  context(`Given 'notes has data`, () => {
    const testNotes = fixtures.makeNotesArray();

    beforeEach("insert notes", () => {
      return db.into("notes").insert(testNotes);
    });
    it("responds with 200 and the specified note", () => {
      const noteId = 2;
      const expectedNote = testNotes[noteId - 1];
      return supertest(app)
        .get(`/api/notes/${noteId}`)
        .expect(200)
        .expect(res => {
          expect(res.body.name).to.eql(expectedNote.name)
          expect(res.body.content).to.eql(expectedNote.content) 
        })
    });
    context(`Given an XSS attack notes`, () => {
      const {
        maliciousNote,
        expectedNote
      } = fixtures.makeMaliciousNote();

      beforeEach("insert malicious note", () => {
        return db.into("notes").insert([maliciousNote]);
      });

      it("removes XSS attack content", () => {
        return supertest(app)
          .get(`/api/notes/${maliciousNote.id}`)
          .expect(200)
          .expect(res => {
            expect(res.body.name).to.eql(expectedNote.name);
            expect(res.body.content).to.eql(expectedNote.content);
          });
      });
    });
  });
  describe("DELETE /api/bookmarks/:id", () => {
    context(`Given no bookmarks`, () => {
      it(`responds 404 the note doesn't exist`, () => {
        return supertest(app)
          .delete(`/api/notes/123`)
          .expect(404, {
            error: { message: `Note Not Found` }
          });
      });
    });
  });
  describe(`PATCH /api/bookmarks/:id`, () => {
    context(`No Bookmarks in database`, () => {
      it(`responds with a 404 when there is no data`, () => {
        const id = 32;
        return supertest(app)
          .patch(`/api/notes/${id}`)
          .expect(404, { error: { message: `Note Not Found` } });
      });
    });
    context(`Test Notes in database`, () => {
      const testNotes = fixtures.makeNotesArray()

      beforeEach('insert notes', () => {
        return db
          .into('notes')
          .insert(testNotes)
      })


      
      
      it(`Updating spesific values responds with a 204 and updates the specified values`, () => {
        const idToUpdate = 1
        const updateNote = {
          name: 'Updated name for testing a single updated paramiter',
        }
        const expectedNote = {
          ...testNotes[idToUpdate - 1],
          ...updateNote
        }
        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .send({
            ...updateNote,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
      })
    });
  });
});