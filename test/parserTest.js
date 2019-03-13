import {expect} from "chai";
import {render} from "../index";

describe("markdown to html", () => {
  describe("text", () => {
    it("text is wrapped in p", () => {
      expect(render("text")).to.equal("<p>text</p>");
    });

    it("multiline text is wrapped in p´s", () => {
      expect(render("text 1\ntext 2")).to.equal("<p>text 1</p>\n<p>text 2</p>");
    });

    it("inline hash (#) is left as is", () => {
      expect(render("text #1")).to.equal("<p>text #1</p>");
    });

    it("inline emphasis (__) instruction is respected", () => {
      expect(render("text __1__")).to.equal("<p>text <strong>1</strong></p>");
    });

    it("inline emphasis (*) instruction is respected", () => {
      expect(render("text *1*")).to.equal("<p>text <i>1</i></p>");
    });
  });

  describe("header", () => {
    it("renders h1 with following chars from string starting with hash", () => {
      expect(render("# Title")).to.equal("<h1>Title</h1>");
    });

    it("renders h2 from double hash", () => {
      expect(render("## Subtitle")).to.equal("<h2>Subtitle</h2>");
    });

    it("renders headling regardless of number of spaces between hash and text from double hash", () => {
      expect(render("##      Subtitle")).to.equal("<h2>Subtitle</h2>");
    });

    it("renders up to h6", () => {
      expect(render("###### Subtitle")).to.equal("<h6>Subtitle</h6>");
    });

    it("above 6 hashes are ignored", () => {
      expect(render("####### Subtitle")).to.equal("<p>####### Subtitle</p>");
    });

    it("renders h2 until end of line text from double hash", () => {
      expect(render("# Title\nNext line.")).to.equal("<h1>Title</h1>\n<p>Next line.</p>");
    });

    it("hash without succeeding whitespace is ignored", () => {
      expect(render("#Title\nNext line.")).to.equal("<p>#Title</p>\n<p>Next line.</p>");
    });

    it("single hash is printed", () => {
      expect(render("#\nNext line.")).to.equal("<p>#</p>\n<p>Next line.</p>");
    });
  });

  describe("emphasis", () => {
    it("renders italic from text surrounded by single asterix or underscore", () => {
      expect(render("Emphasis, aka italics, with *asterisks* or _underscores_.")).to.equal("<p>Emphasis, aka italics, with <i>asterisks</i> or <i>underscores</i>.</p>");
    });

    it("renders strong from text surrounded by double asterix", () => {
      expect(render("Strong emphasis, aka bold, with **asterisks** or __underscores__.")).to.equal("<p>Strong emphasis, aka bold, with <strong>asterisks</strong> or <strong>underscores</strong>.</p>");
    });

    it("renders italic and strong from text surrounded by single asterix and double underscore", () => {
      expect(render("Combined emphasis with **asterisks and _underscores_**.")).to.equal("<p>Combined emphasis with <strong>asterisks and <i>underscores</i></strong>.</p>");
    });

    it("**_asterisks and underscore_**", () => {
      expect(render("**_asterisks and underscore_**")).to.equal("<p><strong><i>asterisks and underscore</i></strong></p>");
    });
  });

  describe("list", () => {
    it("renders unordered list with single item from text starting with hyphen", () => {
      expect(render("- Item")).to.equal("<ul><li>Item</li></ul>");
    });

    it("renders unordered list with multiple items from text starting with hyphen", () => {
      expect(render("- Item 1\n- Item 2")).to.equal("<ul><li>Item 1</li><li>Item 2</li></ul>");
    });

    it("ignores list item not where hyphen is not followed by space", () => {
      expect(render("-Item")).to.equal("<p>-Item</p>");
    });

    it("accepts sublist", () => {
      expect(render("- Item 1\n  - Sub item 1")).to.equal("<ul><li>Item 1<ul><li>Sub item 1</li></ul></li></ul>");
    });

    it("continues list after sublist", () => {
      expect(render("- Item 1\n  - Sub item 1\n- Item 2")).to.equal("<ul><li>Item 1<ul><li>Sub item 1</li></ul></li><li>Item 2</li></ul>");
    });

    it("list with sublist items", () => {
      const markdown = `
- Item 1
  - Item 1.1
  - Item 1.2
`;

      const markup = `
<ul>
<li>Item 1
<ul>
<li>Item 1.1</li>
<li>Item 1.2</li>
</ul>
</li>
</ul>
`;

      expect(render(markdown).replace(/\n/g, "")).to.equal(markup.replace(/\n/g, ""));
    });

    it("list with sublist that contain sublist items", () => {
      const markdown = `
- Item 1
  - Item 1.1
    - Item 1.1.1
    - Item 1.1.2
  - Item 1.2
  - Item 1.3
`;

      const markup = `
<ul>
<li>Item 1
<ul>
<li>Item 1.1
<ul>
<li>Item 1.1.1</li>
<li>Item 1.1.2</li>
</ul>
</li>
<li>Item 1.2</li>
<li>Item 1.3</li>
</ul>
</li>
</ul>
`;

      expect(render(markdown).replace(/\n/g, "")).to.equal(markup.replace(/\n/g, ""));
    });
  });

  describe("links", () => {
    it("[Text](anchor) renders a tag with text and href", () => {
      expect(render("[Text](anchor)")).to.equal("<a href=\"anchor\">Text</a>");
    });

    it("emphasis text is accepted in anchor text", () => {
      expect(render("[__Text__](anchor)")).to.equal("<a href=\"anchor\"><strong>Text</strong></a>");
      expect(render("[**Text**](anchor)")).to.equal("<a href=\"anchor\"><strong>Text</strong></a>");
      expect(render("[_Text_](anchor)")).to.equal("<a href=\"anchor\"><i>Text</i></a>");
    });

    it("use this [link](anchor) wraps link in paragraph", () => {
      expect(render("use this [link](anchor)")).to.equal("<p>use this <a href=\"anchor\">link</a></p>");
    });

    it("## use this [link](anchor) wraps link in header", () => {
      expect(render("## use this [link](anchor)")).to.equal("<h2>use this <a href=\"anchor\">link</a></h2>");
    });
  });

  describe("images", () => {
    it("![alt text](https://imgserver/icon48.png \"Title\") renders img tag with alt and title", () => {
      expect(render("![alt text](https://imgserver/icon48.png \"Title\")")).to.equal("<img src=\"https://imgserver/icon48.png\" alt=\"alt text\" title=\"Title\">");
    });

    it("without title renders image", () => {
      expect(render("![alt text](https://imgserver/icon48.png)")).to.equal("<img src=\"https://imgserver/icon48.png\" alt=\"alt text\">");
    });

    it("renders inline image", () => {
      expect(render("This is an image ![alt text](https://imgserver/icon48.png) with title")).to.equal("<p>This is an image <img src=\"https://imgserver/icon48.png\" alt=\"alt text\"> with title</p>");
    });

    it("renders linked image", () => {
      expect(render("This is a linked [image ![logo](https://cdn/logo.png)](anchor)")).to.equal("<p>This is a linked <a href=\"anchor\">image <img src=\"https://cdn/logo.png\" alt=\"logo\"></a></p>");
    });
  });

  describe("combinations", () => {
    it("text with hyphen renders hyphen", () => {
      expect(render("This is -ignored")).to.equal("<p>This is -ignored</p>");
    });

    it("text with hash renders hash", () => {
      expect(render("This is #ignored")).to.equal("<p>This is #ignored</p>");
    });
  });

  describe("new line chars", () => {
    it("crlf is treated as one new line", () => {
      const markdown = "- Item 1\r\n- Item 2";
      const markup = "<ul><li>Item 1</li><li>Item 2</li></ul>";

      expect(render(markdown)).to.equal(markup);
    });

    it("multiple new line chars are treated as one new line", () => {
      const markdown = `- Item 1${[13, 10, 13, 10, 13].map((n) => String.fromCharCode(n)).join("")}- Item 2`;
      const markup = "<ul><li>Item 1</li><li>Item 2</li></ul>";

      expect(render(markdown)).to.equal(markup);
    });
  });

  describe("multiline", () => {
    it("happytrail #1", () => {
      const markdown = `
# Headline
With _paragraph 1_.
## Subheadline 2
With __paragraph 2__.
### Subheadline 3
With *paragraph 3*.
#### Subheadline 4
With **paragraph 4**.
##### Subheadline 5
With *__paragraph 5__*.
###### Subheadline _6_
With paragraph 6.
- Item 1
- Item 2
- Item 3`;

      const markup = `<h1>Headline</h1>
<p>With <i>paragraph 1</i>.</p>
<h2>Subheadline 2</h2>
<p>With <strong>paragraph 2</strong>.</p>
<h3>Subheadline 3</h3>
<p>With <i>paragraph 3</i>.</p>
<h4>Subheadline 4</h4>
<p>With <strong>paragraph 4</strong>.</p>
<h5>Subheadline 5</h5>
<p>With <i><strong>paragraph 5</strong></i>.</p>
<h6>Subheadline <i>6</i></h6>
<p>With paragraph 6.</p>
<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>`;

      expect(render(markdown)).to.equal(markup);
    });

    it("list breaks when paragraph occur", () => {
      const markdown = `
- Item 1
new paragraph
- Item 1
- Item 2`;

      const markup = `<ul><li>Item 1</li></ul><p>new paragraph</p>
<ul><li>Item 1</li><li>Item 2</li></ul>`;

      expect(render(markdown).replace(/\n/g, "")).to.equal(markup.replace(/\n/g, ""));
    });

    it("links happy trail", () => {
      const markdown = `
- Item with [link0](anchor0)
new paragraph with [link1](anchor1)
- Item 1
  - Sub item with [link2](anchor2)

## Headline with [link3](anchor3)
[link4](anchor4)
`;

      const markup = `
<ul>
<li>Item with <a href="anchor0">link0</a></li>
</ul>
<p>new paragraph with <a href="anchor1">link1</a></p>
<ul>
<li>Item 1
<ul>
<li>Sub item with <a href="anchor2">link2</a></li>
</ul>
</li>
</ul>
<h2>Headline with <a href="anchor3">link3</a></h2>
<a href="anchor4">link4</a>`;

      expect(render(markdown).replace(/\n/g, "")).to.equal(markup.replace(/\n/g, ""));
    });
  });
});
