/**
 * Describes ARIA semantics.
 */
const ARIASemantics = {
  global: {
    match: ':role',
    name: [
      ':attr(aria-label)',
      ':idrefs(aria-labelledby)'
    ],
    description: [
      ':idrefs(aria-describedby)'
    ]
  },
  tab: {
    match: '[role="tab"]',
    role: 'tab',
    rels: {
      controlled: ':idrefs(aria-controls)'
    }
  },
  tabpanel: {
    match: '[role="tabpanel"]',
    role: 'tabpanel',
    rels: {
      controller: '[aria-controls~=:id]'
    }
  },
  button: {
    match: '[role="button"]',
    role: 'button',
    name: [':content']
  }
};
