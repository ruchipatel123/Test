# Typography Audit Report

- **URL:** https://cause-fx-test-project-homepage-rdw99mpqs.vercel.app
- **Viewport:** 1440×900px
- **Audited:** 2026-09-08T04:37:18.231Z
- **Method:** Playwright computed styles (Chrome DevTools equivalent)

## H1

| Sample Text | CSS Selector | Count | Font Family | Font Size | Font Weight | Font Style | Font Color | Line Height | Letter Spacing | Text Transform | Text Align | Margin | Padding |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Log in to Vercel | h1.text-heading-32 | 1 | GeistSans, "GeistSans Fallback" | 32px | 600 | normal | #171717 | 40px | -0.96px | none | start | 0px / 0px | 0px / 0px |

## H2

_No visible elements found._

## H3

_No visible elements found._

## H4

_No visible elements found._

## H5

_No visible elements found._

## Paragraph (`<p>`)

| Sample Text | CSS Selector | Count | Font Family | Font Size | Font Weight | Font Style | Font Color | Line Height | Letter Spacing | Text Transform | Text Align | Background | Margin | Padding |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sign Up | p.text-[14px].leading-[20px].font-medium.text-inherit | 1 | GeistSans, "GeistSans Fallback" | 14px | 500 | normal | #171717 | 20px | normal | none | start | transparent | 0px / 0px | 0px / 0px |
| Don't have an account? Sign Up | p.text-copy-16 | 1 | GeistSans, "GeistSans Fallback" | 16px | 400 | normal | #171717 | 24px | normal | none | start | transparent | 0px / 0px | 0px / 0px |

## Div

_No visible elements found._

## Span

| Sample Text | CSS Selector | Count | Font Family | Font Size | Font Weight | Font Style | Font Color | Line Height | Letter Spacing | Text Transform | Text Align | Margin | Padding |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sign Up | span.truncate.inline-block.px-1.5 | 1 | GeistSans, "GeistSans Fallback" | 14px | 500 | normal | #171717 | 21px | normal | none | start | 0px / 0px | 0px / 0px |
| Continue with Email | span.truncate.inline-block.px-1.5 | 1 | GeistSans, "GeistSans Fallback" | 16px | 500 | normal | #FFFFFF | 24px | normal | none | center | 0px / 0px | 0px / 0px |
| Continue with Google \| Continue with Google \| Continue with | span.truncate.inline-block.px-1.5, span | 12 | GeistSans, "GeistSans Fallback" | 16px | 500 | normal | #171717 | 24px | normal | none | center | 0px / 0px | 0px / 0px |


## Figma Comparison Summary

- **Figma file:** https://www.figma.com/design/JGaKlr4CDH33uW9Gcg6dcC/Untitled
- **Viewport:** 1440px
- **Reference:** Figma Local Styles / frame specs mapped during build (`default.css` tokens + `style.css` frame overrides)
- **Figma MCP status:** Not connected in this session (`FIGMA_ACCESS_TOKEN` not set)

### Mismatches Found (1)

| Bug | Selector | Expected (Figma) | Actual (Live) | Priority |
| --- | --- | --- | --- | --- |
| H1 display heading typography mismatch | h1.text-heading-32 | fontSize: 100px; lineHeight: 91px; letterSpacing: 3px; fontWeight: 700; textTransform: uppercase | fontSize: 32px; lineHeight: 40px; letterSpacing: -0.96px; fontWeight: 600; textTransform: none | critical |

### BugHerd Tasks

