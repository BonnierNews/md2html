export function render(markdown) {
  const NSTATE = {
    PHRASINGCONTENT: 1,
    FLOWCONTENT: 2,
    LIST: 3,
    ATTRIBUTE: 4,
  };

  const CHARS = {
    NEW_LINE: 10,
    CARRIAGE_RETURN: 13,
    SPACE: 32,
    EXCLAMATION_MARK: 33,
    QUOTATION_MARK: 34,
    HASH: 35,
    STARTPARENTHESES: 40,
    ENDPARENTHESES: 41,
    DASH: 45,
    ASTERISK: 42,
    STARTBRACKET: 91,
    ENDBRACKET: 93,
    UNDERSCORE: 95,
  };

  let markup = "";

  const state = [];
  const len = markdown.length - 1;
  let nstate, charcode, indentation = 0, previousIndentation = 0;

  for (let idx = 0; idx <= len; ++idx) {
    charcode = markdown.charCodeAt(idx);

    if (charcode == CHARS.NEW_LINE || charcode == CHARS.CARRIAGE_RETURN) {
      let lookahead = markdown.charCodeAt(idx + 1);
      if (lookahead == CHARS.NEW_LINE || lookahead == CHARS.CARRIAGE_RETURN) continue;

      previousIndentation = indentation;
      indentation = 0;

      if (lookahead == CHARS.SPACE) {
        ++indentation;
        let offset;
        for (offset = idx + 2; offset < len; ++offset) {
          lookahead = markdown.charCodeAt(offset);
          if (lookahead == CHARS.SPACE) {
            ++indentation;
            continue;
          }
          break;
        }
        idx = offset - 1;
      }

      if ((nstate & NSTATE.LIST) == NSTATE.LIST && lookahead !== CHARS.DASH) {
        while (state.length) {
          markup += state.pop();
        }
        nstate = nstate ^ NSTATE.LIST;
        continue;
      }

      if (!nstate || (nstate & NSTATE.FLOWCONTENT) == NSTATE.FLOWCONTENT) continue;

      nstate = undefined;
      const lastState = state.pop();
      if (lastState) markup += lastState + String.fromCharCode(charcode);

      continue;
    } else if (charcode == CHARS.SPACE) {
      markup += " ";
      continue;
    } else if (charcode == CHARS.HASH) { // #
      if (nstate && (nstate & NSTATE.FLOWCONTENT) == 0) {
        markup += "#";
        continue;
      }

      let size = 1, valid;
      let offset;
      for (offset = idx + 1; offset < len; ++offset) {
        const lookahead = markdown.charCodeAt(offset);

        if (lookahead == CHARS.SPACE) {
          valid = true;
          continue;
        } else if (lookahead == charcode) {
          ++size;
          if (size > 6) break;
          continue;
        }
        break;
      }

      if (!valid || size > 6) {
        nstate = nstate | NSTATE.PHRASINGCONTENT;
        markup += "<p>";
        state.push("</p>");
        markup += "#";
        continue;
      }

      const element = "h" + size;
      idx = offset - 1;

      nstate = nstate | NSTATE.PHRASINGCONTENT;
      markup += "<" + element + ">";
      state.push("</" + element + ">");
      continue;
    } else if (charcode == CHARS.DASH) {
      if (nstate && !(nstate & NSTATE.FLOWCONTENT)) {
        markup += "-";
        continue;
      } else if (markdown.charCodeAt(idx + 1) !== CHARS.SPACE) {
        nstate = NSTATE.PHRASINGCONTENT;
        markup += "<p>";
        state.push("</p>");
        markup += "-";
        continue;
      }

      ++idx;

      if ((nstate & NSTATE.LIST) == NSTATE.LIST) {
        if (indentation == previousIndentation) {
          markup += state.pop();
        } else if (indentation > previousIndentation) { // start sublist
          markup += "<ul>";
          state.push("</ul>");
        } else if (indentation < previousIndentation) { // close sublist
          markup += state.pop(); // close last item
          markup += state.pop(); // close sublist
          markup += state.pop(); // close parent item
        }
      } else { // start new list
        markup += "<ul>";
        state.push("</ul>");
      }

      nstate = NSTATE.LIST;
      markup += "<li>";
      state.push("</li>");
      continue;
    } else if (charcode == CHARS.ASTERISK || charcode == CHARS.UNDERSCORE) {
      if (!nstate) {
        markup += "<p>";
        state.push("</p>");
      } else if (!(nstate & NSTATE.PHRASINGCONTENT)) {
        markup += charcode == CHARS.ASTERISK ? "*" : "_";
        continue;
      }

      const sameahead = markdown.charCodeAt(idx + 1) == charcode;
      let element;
      if (sameahead) {
        ++idx;
        element = "strong";
      } else {
        element = "i";
      }

      if (state[state.length - 1] == "</" + element + ">") {
        markup += state.pop();
        continue;
      }

      nstate = nstate | NSTATE.PHRASINGCONTENT;

      markup += "<" + element + ">";
      state.push("</" + element + ">");
    } else if (charcode == CHARS.EXCLAMATION_MARK) {
      let lookahead = markdown.charCodeAt(idx + 1);
      if (lookahead !== CHARS.STARTBRACKET) {
        markup += String.fromCharCode(charcode);
        continue;
      }

      const src = {value: "", charsOnly: true}, alt = {value: ""}, title = {value: ""};
      let offset;
      let attr = alt;
      for (offset = idx + 2; offset < len; ++offset) {
        lookahead = markdown.charCodeAt(offset);

        if (lookahead == CHARS.ENDBRACKET) {
          attr = undefined;
          continue;
        } else if (lookahead == CHARS.STARTPARENTHESES) {
          attr = src;
          continue;
        } else if (lookahead == CHARS.ENDPARENTHESES) {
          break;
        } else if (lookahead === CHARS.SPACE && attr && attr.charsOnly) {
          attr = title;
          continue;
        } else if (lookahead === CHARS.SPACE && attr && attr.charsOnly) {
          continue;
        } else if (lookahead === CHARS.QUOTATION_MARK) {
          continue;
        } else if (attr) {
          attr.value += String.fromCharCode(lookahead);
          continue;
        }

        break;
      }

      idx = offset;


      markup += "<img src=\"" + src.value + "\"";
      if (alt.value) {
        markup += " alt=\"" + alt.value + "\"";
      }
      if (title.value) {
        markup += " title=\"" + title.value + "\"";
      }
      markup += ">";

      nstate = nstate | NSTATE.PHRASINGCONTENT;

      continue;
    } else if (charcode == CHARS.STARTBRACKET) {
      markup += "<a href=\"#link\">";
      state.push("</a>");

      nstate = nstate | NSTATE.PHRASINGCONTENT;

      continue;
    } else if (charcode == CHARS.ENDBRACKET) {
      let link = "", valid;
      let offset;
      for (offset = idx + 1; offset < len; ++offset) {
        const lookahead = markdown.charCodeAt(offset);

        if (lookahead == CHARS.STARTPARENTHESES) {
          valid = true;
          continue;
        } else if (valid && lookahead == CHARS.ENDPARENTHESES) {
          break;
        } else if (valid) {
          link += String.fromCharCode(lookahead);
          continue;
        }

        break;
      }

      idx = offset;

      markup = markup.replace("<a href=\"#link\">", "<a href=\"" + link + "\">") + state.pop();

      continue;
    } else {
      if (!nstate) {
        nstate = NSTATE.PHRASINGCONTENT;
        markup += "<p>";
        state.push("</p>");
      }

      markup += String.fromCharCode(charcode);
    }
  }

  for (let i = state.length - 1; i >= 0; --i) markup += state[i];

  return markup;
}
