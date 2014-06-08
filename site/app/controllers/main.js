var fs = require('fs')
  , md = require('marked')
  , content = fs.readFileSync('../docs/overview.md').toString()
  , hl = require('highlight').Highlight;

content = content.replace(/<code:javascript>/g, '<pre><code>')
    .replace(/<\/code>/g, '</code></pre>');
content = md(content);
content = hl(content, false, true);

var Main = function () {
  this.index = function (req, resp, params) {
    this.respond({content: content}, {
      format: 'html'
    , template: 'app/views/main/index'
    });
  };
};

exports.Main = Main;


