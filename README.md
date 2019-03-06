MD2HTML
=======

[![Build Status](https://travis-ci.org/BonnierNews/md2html.svg?branch=master)](https://travis-ci.org/BonnierNews/md2html)

Markdown to HTML converter.

Supports:
- `#`
- `-`
  - '-'
- `*`
- `_`
- `[_Bait_](https://www.example.com)`: links

```js
import {render} from 'md2html';

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
  - Sub item 1
- Item 3`;

console.log(render(markdown));
```
