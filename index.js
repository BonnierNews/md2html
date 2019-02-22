export function render(markdown) {
  const FLOWCONTENT = 1;
  const PHRASINGCONTENT = 2;
  const LIST = 3;
  const CHARS = {
    WHITE_SPACE_START: 9,
    WHITE_SPACE_END: 13,
    SPACE: 32,
    HASH: 35,
    DASH: 45,
    ASTERISK: 42,
    UNDERSCORE: 95,
  };

  let markup = "";

  const state = [];
  const len = markdown.length - 1;
  let nstate, charcode, indentation = 0, previousIndentation = 0;

  for (let idx = 0; idx <= len; ++idx) {
    charcode = markdown.charCodeAt(idx);

    if (charcode >= CHARS.WHITE_SPACE_START && charcode <= CHARS.WHITE_SPACE_END) {
      previousIndentation = indentation;
      let lookahead = markdown.charCodeAt(idx + 1);
      if (lookahead === CHARS.SPACE) {
        ++indentation;
        let offset;
        for (offset = idx + 2; offset < len; ++offset) {
          lookahead = markdown.charCodeAt(offset);
          if (lookahead === CHARS.SPACE) {
            ++indentation;
            continue;
          }
          break;
        }
        idx = offset - 1;
      } else {
        indentation = 0;
      }

      if (nstate === LIST && lookahead !== CHARS.DASH) {
        while (state.length) {
          markup += "</" + state.pop() + ">";
        }
        nstate = undefined;
        continue;
      }

      if (!nstate || (nstate & FLOWCONTENT) === FLOWCONTENT) continue;

      markup += "</" + state.pop() + ">" + String.fromCharCode(charcode);

      nstate = undefined;
      continue;
    } else if (charcode === CHARS.SPACE) {
      markup += " ";
      continue;
    } else if (charcode === CHARS.HASH) { // #
      if (nstate && (nstate & FLOWCONTENT) === 0) {
        markup += "#";
        continue;
      }

      let size = 1, valid;
      let offset;
      for (offset = idx + 1; offset < len; ++offset) {
        const lookahead = markdown.charCodeAt(offset);

        if (lookahead === CHARS.SPACE) {
          valid = true;
          continue;
        } else if (lookahead === charcode) {
          ++size;
          if (size > 6) break;
          continue;
        }
        break;
      }

      if (!valid || size > 6) {
        nstate = PHRASINGCONTENT;
        markup += "<p>";
        state.push("p");
        markup += "#";
        continue;
      }

      const element = "h" + size;
      idx = offset - 1;

      nstate = PHRASINGCONTENT;
      markup += "<" + element + ">";
      state.push(element);
      continue;
    } else if (charcode === CHARS.DASH) {
      if (nstate && (nstate & FLOWCONTENT) === 0) {
        markup += "-";
        continue;
      } else if (markdown.charCodeAt(idx + 1) !== CHARS.SPACE) {
        nstate = PHRASINGCONTENT;
        markup += "<p>";
        state.push("p");
        markup += "-";
        continue;
      }

      ++idx;

      const upState = state[state.length - 1];

      if (upState === "li" && indentation === previousIndentation) {
        markup += "</" + state.pop() + ">";
      } else if (upState === "li" && indentation > previousIndentation) { // start sublist
        markup += "<ul>";
        state.push("ul");
      } else if (indentation < previousIndentation) { // close sublist
        markup += "</" + state.pop() + ">"; // close last item
        markup += "</" + state.pop() + ">"; // close sublist
        markup += "</" + state.pop() + ">"; // close parent item
      } else if (upState !== "ul") {
        markup += "<ul>";
        state.push("ul");
      }

      nstate = LIST;
      markup += "<li>";
      state.push("li");
      continue;

    } else if (charcode === CHARS.ASTERISK || charcode === CHARS.UNDERSCORE) {
      if (!nstate) {
        markup += "<p>";
        state.push("p");
      } else if ((nstate & PHRASINGCONTENT) === 0) {
        markup += charcode === CHARS.ASTERISK ? "*" : "_";
        continue;
      }

      const sameahead = markdown.charCodeAt(idx + 1) === charcode;
      let element;
      if (sameahead) {
        ++idx;
        element = "strong";
      } else {
        element = "i";
      }

      if (state[state.length - 1] === element) {
        markup += "</" + state.pop() + ">";
        continue;
      }

      nstate = PHRASINGCONTENT;

      markup += "<" + element + ">";
      state.push(element);
    } else {

      if (!nstate) {
        nstate = PHRASINGCONTENT;
        markup += "<p>";
        state.push("p");
      }

      markup += String.fromCharCode(charcode);
    }
  }

  for (let i = state.length - 1; i >= 0; --i) markup += `</${state[i]}>`;

  return markup;
}
