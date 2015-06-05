/**
 * Describes ARIA semantics.
 */
const ARIASemantics = {
  global: {
    match: ":role",
    name: [
      ":attr(aria-label)",
      ":idrefs(aria-labelledby)"
    ],
    description: [
      ":idrefs(aria-describedby)"
    ]
  },
  button: {
    match: "[role='button']",
    role: "button",
    name: [":content"]
  }
};
