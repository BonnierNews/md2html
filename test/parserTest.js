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
  });

  describe("combinations", () => {
    it("text with hyphen renders hyphen", () => {
      expect(render("This is -ignored")).to.equal("<p>This is -ignored</p>");
    });

    it("text with hash renders hash", () => {
      expect(render("This is #ignored")).to.equal("<p>This is #ignored</p>");
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

    it("happytrail #2", () => {
      const markdown = `
- Item 1
new paragraph
- Item 1
- Item 2`;

      const markup = `<ul><li>Item 1</li></ul><p>new paragraph</p>
<ul><li>Item 1</li><li>Item 2</li></ul>`;

      expect(render(markdown)).to.equal(markup);
    });
  });
});
