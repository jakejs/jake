var fs = require('fs')
  , Md2Toc = require('md2toc').Md2Toc
  , docs = fs.readFileSync('../docs/overview.md').toString()
  , hl = require('highlight').Highlight
  , res;

docs = docs.replace(/<code:javascript>/g, '<pre><code>')
    .replace(/<\/code>/g, '</code></pre>');
var res = new Md2Toc(docs);
docs = res.contentHtml;
docs = docs.replace(/\&#39;/g, "'");
res.contentHtml = hl(docs, false, true);

var Main = function () {
  this.index = function (req, resp, params) {
    this.respond({content: ''}, {
      format: 'html'
    , template: 'app/views/main/index'
    });
  };

  this.docs = function (req, resp, params) {
    this.respond({content: res}, {
      format: 'html'
    , template: 'app/views/main/docs'
    });
  };
};

exports.Main = Main;


