function makeNotesArray() {
  return [
    {
      id: 1,
      name: "Note one",
      folderid: 1,
      content: "This is the content for note one",
      modified: "2019-11-08T02:17:20.397Z"
    },
    {
      id: 2,
      name: "Note two",
      folderid: 1,
      content: "This is the content for note two",
      modified: "2019-11-08T02:17:20.397Z"
    },
    {
      id: 3,
      name: "Note three",
      folderid: 1,
      content: "This is the content for note three",
      modified: "2019-11-08T02:17:20.397Z"
    }
  ];
}

function makeMaliciousNote() {
  const maliciousNote = {
    id: 911,
    name: 'Naughty naughty very naughty <script>alert("xss");</script>',
    folderid: 1,
    content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
  };
  const expectedNote = {
    ...maliciousNote,
    name:
      'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
    content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  };
  return {
    maliciousNote,
    expectedNote
  };
}

module.exports = {
  makeNotesArray,
  makeMaliciousNote
};
